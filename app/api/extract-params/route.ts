import { azure } from "@ai-sdk/azure";
import { generateObject, type ModelMessage } from "ai";
import { resolveExtractor } from "./extractors";

export async function POST(req: Request) {
  let body: { question?: string; toolKey?: string; imageData?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { question, toolKey, imageData } = body;

  if (!toolKey || typeof toolKey !== "string") {
    return Response.json({ error: "Missing toolKey" }, { status: 400 });
  }
  if (!question && !imageData) {
    return Response.json(
      { error: "Missing question or imageData" },
      { status: 400 }
    );
  }

  const extractor = resolveExtractor(toolKey);
  if (!extractor) {
    // 未注册的工具：返回空参数，让 HTML 使用默认值
    return Response.json({});
  }

  const textContent = extractor.buildUserMessage
    ? extractor.buildUserMessage({ question: question ?? "", toolKey })
    : `請從以下題目提取參數。題目：${question ?? "（見圖片）"}`;

  // 如果题目是图片，把图片同时传给 vision model
  const messages: ModelMessage[] = imageData
    ? [
        {
          role: "user",
          content: [
            { type: "text", text: textContent },
            { type: "image", image: imageData },
          ],
        },
      ]
    : [{ role: "user", content: textContent }];

  try {
    const result = await generateObject({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
      system: extractor.system,
      schema: extractor.schema,
      messages,
    });

    const validated = extractor.validate
      ? (() => {
          try {
            return extractor.validate!(result.object);
          } catch (validateErr) {
            // 校验失败通常是因为用户选了不匹配的工具，AI 只能返回「空壳」参数。
            // 不抛 500，让前端用默认值渲染 HTML。
            console.warn("[extract-params] validate failed, returning raw", {
              toolKey,
              message:
                validateErr instanceof Error ? validateErr.message : validateErr,
            });
            return result.object;
          }
        })()
      : result.object;

    return Response.json(validated);
  } catch (err) {
    console.error("[extract-params] extraction failed", { toolKey, err });
    const message =
      err instanceof Error ? err.message : "Failed to extract parameters";
    return Response.json({ error: message }, { status: 500 });
  }
}
