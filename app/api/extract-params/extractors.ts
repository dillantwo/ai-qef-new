import { z } from "zod";

/**
 * 参数提取器注册表
 *
 * 每个 extractor 描述如何从题目中提取某个工具所需的 HTML 参数：
 *   - schema: Zod schema，用于 generateObject 的结构化输出
 *   - system: 给 AI 的系统提示词
 *   - buildUserMessage?: 可选，自定义 user message（默认会带上题目）
 *   - validate?: 可选，对 AI 产生的参数做合理性校验 / 归一化
 *
 * 新增工具时只需在下方追加一条即可，无需修改 route.ts。
 * 如果某个工具 key 没有精确匹配，会 fallback 到 prefix 匹配（见 resolveExtractor）。
 */

export interface Extractor<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  schema: TSchema;
  system: string;
  buildUserMessage?: (ctx: { question: string; toolKey: string }) => string;
  /** 对 AI 返回结果做后校验/归一化。抛出错误会让调用方返回 500。 */
  validate?: (value: z.infer<TSchema>) => z.infer<TSchema>;
}

// ---------- Fraction: 扩分 / 约分 ----------
const fractionExpandingSimplifying: Extractor = {
  schema: z.object({
    numerator: z.number().int().describe("原分數的分子"),
    denominator: z.number().int().describe("原分數的分母"),
    mode: z.enum(["expand", "simplify"]).describe("擴分(expand)或約分(simplify)"),
    targetNumerator: z
      .number()
      .int()
      .nullable()
      .describe("目標分子；若題目留空（□/?）則為 null"),
    targetDenominator: z
      .number()
      .int()
      .nullable()
      .describe("目標分母；若題目留空（□/?）則為 null"),
  }),
  system: `你是一位數學題目參數提取專家。從題目中提取分數擴分或約分的參數。

注意事項：
- numerator 是原分數的分子
- denominator 是原分數的分母
- mode: "expand"=擴分（乘以一個數使分母變大），"simplify"=約分（除以公因數使分母變小）
- 根據題意判斷是擴分還是約分：
  - 如果目標分母比原分母小，這是約分
  - 如果目標分母比原分母大，這是擴分
  - 如果題目明確說「約分」或「最簡分數」，mode 為 simplify
  - 如果題目明確說「擴分」，mode 為 expand
- targetNumerator / targetDenominator: 等號右邊已知的分子/分母；如果是空格/問號（要學生填的），設為 null
- 例如 72/96 = □/12 → numerator=72, denominator=96, targetNumerator=null, targetDenominator=12
- 例如 3/5 = 9/□ → numerator=3, denominator=5, targetNumerator=9, targetDenominator=null
- 如果題目沒有等號右邊的目標分數，兩個 target 都設為 null
- 如果題目是圖片，請從圖片中識別題目`,
  buildUserMessage: ({ question }) =>
    `請從以下題目提取擴分/約分參數。題目：${question || "（見圖片）"}`,
  validate: (v) => {
    if (v.denominator === 0) {
      throw new Error("denominator 不能為 0");
    }
    return v;
  },
};

// ---------- Fraction: 加 / 减 / 乘 / 除 ----------
const fractionOperation: Extractor = {
  schema: z.object({
    whole1: z.number().int().min(0).describe("第一個數的整數部分（真分數為 0）"),
    num1: z.number().int().describe("第一個數的分子"),
    den1: z.number().int().describe("第一個數的分母"),
    whole2: z.number().int().min(0).describe("第二個數的整數部分"),
    num2: z.number().int().describe("第二個數的分子"),
    den2: z.number().int().describe("第二個數的分母"),
    operation: z.enum(["add", "sub", "mul", "div"]).describe("運算類型"),
    contextText: z.string().describe("題目情境描述（簡短）"),
    unit: z.string().describe("單位，如 L、kg、cm，沒有就留空"),
  }),
  system: `你是一位數學題目參數提取專家。從題目中提取分數運算的參數。

注意事項：
- 帶分數要拆成整數部分和分數部分，例如 3⅝ → whole1=3, num1=5, den1=8
- 如果是真分數（沒有整數部分），whole 設為 0
- 運算符：add=加法, sub=減法, mul=乘法, div=除法
- 如果題目是應用題，提取其中的數學運算部分
- contextText 是題目的情境描述（例如「店員把橙汁倒進玻璃杯」），用於在練習工具中顯示
- unit 是題目中使用的單位（例如 L、kg、cm），如果沒有單位就留空
- 分母（den1, den2）不可為 0
- 如果題目是圖片，請從圖片中識別題目`,
  buildUserMessage: ({ question, toolKey }) => {
    const operation = toolKey.split("-")[1] ?? "";
    return `請從以下題目提取分數運算參數。工具類型：${operation}。題目：${question || "（見圖片）"}`;
  },
  validate: (v) => {
    if (v.den1 === 0 || v.den2 === 0) {
      throw new Error("分母不能為 0");
    }
    // 除法：除數不能為 0（whole2 + num2/den2 == 0）
    if (v.operation === "div" && v.whole2 === 0 && v.num2 === 0) {
      throw new Error("除數不能為 0");
    }
    return v;
  },
};

const exactMatches: Record<string, Extractor> = {
  "fraction-expanding-simplifying": fractionExpandingSimplifying,
  "fraction-addition": fractionOperation,
  "fraction-subtraction": fractionOperation,
  "fraction-multiplication": fractionOperation,
  "fraction-division": fractionOperation,
};

const prefixMatches: Array<{ prefix: string; extractor: Extractor }> = [
  { prefix: "fraction-", extractor: fractionOperation },
];

export function resolveExtractor(toolKey: string): Extractor | null {
  if (exactMatches[toolKey]) return exactMatches[toolKey];
  for (const { prefix, extractor } of prefixMatches) {
    if (toolKey.startsWith(prefix)) return extractor;
  }
  return null;
}
