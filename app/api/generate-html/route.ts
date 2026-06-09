import { createAzure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Dedicated Azure provider for the math AI tool generator.
 * Uses gpt-5.3-codex with API version 2026-02-24, independent from the shared
 * AZURE_OPENAI_DEPLOYMENT used by the other subjects. Falls back to the shared
 * config when the HTML-specific env vars are not set.
 */
const htmlGenProvider = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
  // Azure codex models use the Responses API, which @ai-sdk/azure v3 serves via
  // the new /openai/v1 endpoint. That endpoint only accepts api-version=preview
  // (dated versions like 2025-04-01-preview are rejected / 404 on this path).
  apiVersion: process.env.AZURE_OPENAI_HTML_API_VERSION ?? "preview",
});

const HTML_GEN_DEPLOYMENT =
  process.env.AZURE_OPENAI_HTML_DEPLOYMENT ??
  process.env.AZURE_OPENAI_DEPLOYMENT ??
  "gpt-5.3-codex";

function stripCodeFences(html: string): string {
  return html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Domains that are known to be compromised / unsafe and must never be loaded
 * from generated tools. polyfill.io was sold and taken over in 2024 and now
 * serves a 401 Basic-Auth challenge (the "Sign in" popup) or malicious payloads,
 * so any reference to it has to be stripped out of AI-generated HTML.
 */
const BLOCKED_SCRIPT_HOSTS = [
  "polyfill.io",
  "polyfill.com",
  "bootcss.com",
  "bootcdn.net",
  "staticfile.org",
];

/**
 * Remove <script src="..."> / <link href="..."> tags that point at blocked,
 * compromised hosts. The system prompt already asks the model to inline all
 * assets, but models occasionally add an external <script> anyway (commonly
 * polyfill.io), which triggers the browser sign-in popup, so we defensively
 * scrub the output server-side.
 */
function removeBlockedExternalAssets(html: string): string {
  const hostPattern = BLOCKED_SCRIPT_HOSTS.map((host) =>
    host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|");

  if (!hostPattern) return html;

  const blocked = new RegExp(`(?:https?:)?//(?:[\\w.-]*\\.)?(?:${hostPattern})`, "i");

  return (
    html
      // Drop full <script ...></script> blocks whose src is a blocked host.
      .replace(/<script\b[^>]*\bsrc\s*=\s*(['"])(.*?)\1[^>]*>[\s\S]*?<\/script>/gi, (match, _q, src) =>
        blocked.test(src) ? "" : match
      )
      // Drop self-closing / void <script src=...> tags too.
      .replace(/<script\b[^>]*\bsrc\s*=\s*(['"])(.*?)\1[^>]*\/?>/gi, (match, _q, src) =>
        blocked.test(src) ? "" : match
      )
      // Drop <link ... href="blocked"> (e.g. preconnect/preload to the host).
      .replace(/<link\b[^>]*\bhref\s*=\s*(['"])(.*?)\1[^>]*\/?>/gi, (match, _q, href) =>
        blocked.test(href) ? "" : match
      )
  );
}

function ensureHtmlDocument(html: string): string {
  const cleaned = removeBlockedExternalAssets(stripCodeFences(html));
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
      model: htmlGenProvider(HTML_GEN_DEPLOYMENT),
      system: `你是一位資深前端互動教具工程師，專門為老師製作可直接在瀏覽器中運行的單檔 HTML 學習工具。

請根據老師的要求，生成或更新一個完整、可直接放進 iframe 的 HTML 文件。

硬性要求：
1. 回傳完整 HTML，必須是單一 HTML 文件。
2. 所有 CSS 和 JavaScript 都要內嵌，不能依賴外部 CDN、npm 套件、字體或圖片。嚴禁引用 polyfill.io、cdn.polyfill.io 或任何外部 <script src>（這些網域已被入侵，會導致瀏覽器跳出登入視窗）。
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
    // Surface as much Azure detail as possible to diagnose 500s (wrong
    // deployment name, unsupported api-version, auth, etc.).
    const err = error as {
      message?: string;
      name?: string;
      statusCode?: number;
      url?: string;
      responseBody?: string;
      data?: unknown;
    };
    console.error("[generate-html] Error:", {
      name: err?.name,
      message: err?.message,
      statusCode: err?.statusCode,
      url: err?.url,
      responseBody: err?.responseBody,
      deployment: HTML_GEN_DEPLOYMENT,
    });
    return new Response(
      JSON.stringify({
        error: err?.message ?? "Unknown error",
        statusCode: err?.statusCode,
        responseBody: err?.responseBody,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}