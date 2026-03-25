import { azure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { ToolboxConfig } from "@/models/ToolboxConfig";

/**
 * Fix LaTeX commands broken by JSON parsing.
 * When the model outputs e.g. \frac in a JSON string value,
 * the JSON parser interprets \f as a form-feed char (0x0C),
 * \t as tab, \b as backspace, etc., destroying the LaTeX.
 */
function fixBrokenLatex(text: string): string {
  return text
    .replace(/\f/g, "\\f")             // fixes \frac, \flat …
    .replace(/\t(?=[a-zA-Z])/g, "\\t") // fixes \times, \theta, \text …
    .replace(/\x08(?=[a-zA-Z])/g, "\\b") // fixes \bar, \binom …
    .replace(/\r(?=[a-zA-Z])/g, "\\r") // fixes \right, \rangle …
    .replace(/\n(?=[a-zA-Z])/g, "\\n"); // fixes \ne, \nu …
}

export async function POST(req: Request) {
  const { question, imageData } = await req.json();

  // Fetch active toolbox types from DB
  await connectDB();
  const configs = await ToolboxConfig.find({ isActive: true }).lean();
  const validTypes = configs.map((c) => c.type);
  const typeDescriptions = configs
    .map((c) => `- ${c.type}：${c.description}`)
    .join("\n");

  const messages: Array<{ role: "user"; content: string | Array<{ type: "text"; text: string } | { type: "image"; image: string; mimeType?: string }> }> = [];

  if (imageData) {
    // Strip the data URL prefix to get raw base64 + extract mime type
    const match = (imageData as string).match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/png";
    const base64 = match ? match[2] : imageData;

    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `請判斷以下數學題目屬於什麼題型。題目文字：${question || "（見圖片）"}`,
        },
        {
          type: "image",
          image: base64,
          mimeType,
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `請判斷以下數學題目屬於什麼題型。題目：${question}`,
    });
  }

  // Build enum dynamically: valid types + "other"
  const allTypes = [...new Set([...validTypes, "other"])] as [string, ...string[]];

  const result = await generateObject({
    model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
    system: `你是一位數學題型分類專家。根據學生輸入的題目，判斷它屬於哪個題型。

可選題型：
${typeDescriptions}
- other：其他題型（不屬於以上任何題型）

同時提取題目的文字描述。如果是圖片題目，請描述圖片中的數學題目內容。

重要：在 question 欄位中，所有數學表達式必須使用 LaTeX 格式：
- 分數用 \\frac{分子}{分母}，例如 \\frac{5}{6}
- 帶分數用 整數\\frac{分子}{分母}，例如 2\\frac{5}{6}
- 乘號用 \\times，除號用 \\div
- 用 $ 符號包裹行內數學公式，例如 $2\\frac{5}{6} + \\frac{3}{4} - 1\\frac{1}{3} =$`,
    schema: z.object({
      type: z
        .enum(allTypes)
        .describe("題型分類"),
      question: z
        .string()
        .describe("題目的文字描述，使用 LaTeX 數學格式"),
    }),
    messages,
  });

  const obj = result.object;
  return Response.json({
    ...obj,
    question: fixBrokenLatex(obj.question),
  });
}
