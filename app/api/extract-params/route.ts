import { azure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { question, toolKey } = await req.json();

  if (!question || !toolKey) {
    return Response.json({ error: "Missing question or toolKey" }, { status: 400 });
  }

  // Determine what parameters to extract based on tool type
  const toolCategory = toolKey.split("-")[0]; // e.g. "fraction", "algebra"
  const operation = toolKey.split("-")[1];     // e.g. "add", "sub", "mul", "div"

  if (toolKey === "fraction-expanding-simplifying") {
    const result = await generateObject({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
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
- targetNumerator: 等號右邊已知的分子；如果分子是空格/問號（要學生填的），設為 -1
- targetDenominator: 等號右邊已知的分母；如果分母是空格/問號（要學生填的），設為 -1
- 例如 72/96 = □/12 → numerator=72, denominator=96, targetNumerator=-1, targetDenominator=12
- 例如 3/5 = 9/□ → numerator=3, denominator=5, targetNumerator=9, targetDenominator=-1
- 如果題目沒有等號右邊的目標分數，兩個 target 都設為 -1`,
      schema: z.object({
        numerator: z.number().describe("原分數的分子"),
        denominator: z.number().describe("原分數的分母"),
        mode: z.enum(["expand", "simplify"]).describe("擴分(expand)或約分(simplify)"),
        targetNumerator: z.number().describe("目標分子，空格/問號為 -1"),
        targetDenominator: z.number().describe("目標分母，空格/問號為 -1"),
      }),
      messages: [
        {
          role: "user",
          content: `請從以下題目提取擴分/約分參數。題目：${question}`,
        },
      ],
    });

    return Response.json(result.object);
  }

  if (toolCategory === "fraction") {
    const result = await generateObject({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
      system: `你是一位數學題目參數提取專家。從題目中提取分數運算的參數。

注意事項：
- 帶分數要拆成整數部分和分數部分，例如 3⅝ → whole1=3, num1=5, den1=8
- 如果是真分數（沒有整數部分），whole 設為 0
- 運算符：add=加法, sub=減法, mul=乘法, div=除法
- 如果題目是應用題，提取其中的數學運算部分
- contextText 是題目的情境描述（例如「店員把橙汁倒進玻璃杯」），用於在練習工具中顯示
- unit 是題目中使用的單位（例如 L、kg、cm），如果沒有單位就留空`,
      schema: z.object({
        whole1: z.number().describe("第一個數的整數部分（帶分數的整數，真分數為 0）"),
        num1: z.number().describe("第一個數的分子"),
        den1: z.number().describe("第一個數的分母"),
        whole2: z.number().describe("第二個數的整數部分"),
        num2: z.number().describe("第二個數的分子"),
        den2: z.number().describe("第二個數的分母"),
        operation: z.enum(["add", "sub", "mul", "div"]).describe("運算類型"),
        contextText: z.string().describe("題目情境描述（簡短）"),
        unit: z.string().describe("單位，如 L、kg、cm，沒有就留空"),
      }),
      messages: [
        {
          role: "user",
          content: `請從以下題目提取分數運算參數。工具類型：${operation}。題目：${question}`,
        },
      ],
    });

    return Response.json(result.object);
  }

  // Default: return empty params for unsupported tool types
  return Response.json({});
}
