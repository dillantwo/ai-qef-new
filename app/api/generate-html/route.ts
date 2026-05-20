import { azure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";

function stripCodeFences(html: string): string {
  return html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function ensureHtmlDocument(html: string): string {
  const cleaned = stripCodeFences(html);
  if (/<!doctype html>/i.test(cleaned) || /<html[\s>]/i.test(cleaned)) {
    return cleaned;
  }

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated Tool</title>
  </head>
  <body>
    ${cleaned}
  </body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const { prompt, imageData, currentHtml, currentTitle } = (await req.json()) as {
      prompt?: string;
      imageData?: string;
      currentHtml?: string;
      currentTitle?: string;
    };

    if (!prompt && !imageData) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages: Array<{
      role: "user";
      content:
        | string
        | Array<{ type: "text"; text: string } | { type: "image"; image: string; mimeType?: string }>;
    }> = [];

    if (imageData) {
      const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
      const mimeType = match ? match[1] : "image/png";
      const base64 = match ? match[2] : imageData;

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: currentHtml
              ? `請根據以下修改要求更新這個互動數學 HTML 工具：${prompt || "（見圖片）"}`
              : `請根據以下要求生成一個可直接執行的互動數學 HTML 工具：${prompt || "（見圖片）"}`,
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
        content: currentHtml
          ? `請根據以下修改要求更新這個互動數學 HTML 工具：${prompt}`
          : `請根據以下要求生成一個可直接執行的互動數學 HTML 工具：${prompt}`,
      });
    }

    if (currentHtml) {
      messages.unshift({
        role: "user",
        content: `這是目前工具的資訊：\n標題：${currentTitle || "未命名工具"}\n\n請保留可用的互動部分，只按最新要求修改。\n\n目前 HTML：\n${currentHtml}`,
      });
    }

    const result = await generateObject({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
      system: `你是一位資深前端互動教具工程師，專門為老師製作可直接在瀏覽器中運行的單檔 HTML 學習工具。

請根據老師的要求，生成或更新一個完整、可直接放進 iframe 的 HTML 文件。

硬性要求：
1. 回傳完整 HTML，必須是單一 HTML 文件。
2. 所有 CSS 和 JavaScript 都要內嵌，不能依賴外部 CDN、npm 套件、字體或圖片。
3. 介面要清晰、現代、適合桌面與平板。
4. 工具需要真的可互動，不能只是一頁靜態說明。
5. 內容以繁體中文呈現。
6. 若題意不足，補上最合理的預設值，但仍要讓工具可運作。
7. 不要輸出 Markdown code fences。
8. 如果提供了目前 HTML，代表這次是修改既有工具，不要無故重做成完全不同的工具；優先保留原本可用的互動結構，再按要求調整。

請同時提供：
- title：工具名稱
- html：完整 HTML 字串`,
      schema: z.object({
        title: z.string().min(1),
        html: z.string().min(1),
      }),
      messages,
    });

    return Response.json({
      title: result.object.title.trim(),
      html: ensureHtmlDocument(result.object.html),
    });
  } catch (error) {
    console.error("[generate-html] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}