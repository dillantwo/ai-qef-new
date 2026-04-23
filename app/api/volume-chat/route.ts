import { azure } from "@ai-sdk/azure";
import { streamText, type UIMessage } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";

interface SceneCube { x: number; y: number; z: number; color: string }
interface SceneState {
  cubeCount: number;
  volume: number;
  surfaceArea: number;
  enclosedVolume: number;
  poolVolume: number;
  views: { top: number; front: number; side: number };
  bbox: {
    minX: number; minY: number; minZ: number;
    maxX: number; maxY: number; maxZ: number;
    width: number; height: number; depth: number;
    bboxVolume: number;
  };
  cubes: SceneCube[];
  mode: string;
  tool: string;
}

function uiMessagesToModelMessages(messages: UIMessage[]): ModelMessage[] {
  return messages.map((msg) => {
    const text = msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("");
    const imageParts = msg.parts
      .filter(
        (p): p is { type: "file"; mediaType: string; url: string; filename?: string } =>
          p.type === "file" && typeof (p as { mediaType?: string }).mediaType === "string" &&
          (p as { mediaType: string }).mediaType.startsWith("image/")
      )
      .map((p) => ({ type: "image" as const, image: p.url }));

    if (msg.role === "assistant") {
      return { role: "assistant" as const, content: [{ type: "text" as const, text }] };
    }
    if (msg.role === "user") {
      const content: Array<
        { type: "text"; text: string } | { type: "image"; image: string }
      > = [];
      if (text) content.push({ type: "text" as const, text });
      content.push(...imageParts);
      if (content.length === 0) content.push({ type: "text" as const, text: "" });
      return { role: "user" as const, content };
    }
    return { role: "system" as const, content: text };
  });
}

function describeCubes(cubes: SceneCube[]): string {
  if (cubes.length === 0) return "（場景中目前沒有任何方塊）";
  // Bounding box on x/z plane
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let maxY = 0;
  for (const c of cubes) {
    if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x;
    if (c.z < minZ) minZ = c.z; if (c.z > maxZ) maxZ = c.z;
    if (c.y > maxY) maxY = c.y;
  }
  // Heightmap: column (x, z) -> tallest y+1 (number of stacked cubes)
  const W = maxX - minX + 1, D = maxZ - minZ + 1;
  const heights: number[][] = Array.from({ length: D }, () => new Array(W).fill(0));
  for (const c of cubes) {
    const h = c.y + 1;
    if (h > heights[c.z - minZ][c.x - minX]) heights[c.z - minZ][c.x - minX] = h;
  }
  // ASCII top-down view: row 0 = back (small z), each cell = column height ('.' = empty)
  const rows = heights.map((row) =>
    row.map((h) => (h === 0 ? "." : h.toString(36).toUpperCase())).join(" ")
  );
  // Header line with x labels
  const xHeader = "    " + Array.from({ length: W }, (_, i) => ((minX + i + 100) % 10).toString()).join(" ");
  const body = rows
    .map((line, i) => `z=${String(minZ + i).padStart(2)}  ${line}`)
    .join("\n");

  // Per-color counts
  const byColor = new Map<string, number>();
  for (const c of cubes) byColor.set(c.color, (byColor.get(c.color) ?? 0) + 1);
  const colorSummary = Array.from(byColor.entries())
    .map(([hex, n]) => `${hex}×${n}`).join(", ");

  return `俯視高度圖（每格的數字 = 該位置往上堆了幾個方塊；"." 代表空白；最高 ${maxY + 1}）：
\`\`\`
x= ${xHeader.trim()}
${body}
\`\`\`
顏色分佈：${colorSummary}`;
}

function buildSystemPrompt(state: SceneState | null): string {
  const base = `你是「立體積木探索」工具的 AI 助教，協助小學至初中學生理解三維幾何概念，重點包括：
- 體積（單位：立方單位 / cube units）
- 表面積（單位：平方單位 / square units）
- 「圍起來的體積 / 可裝水量」（水池模型）
- 「完全封閉的內部空間」（六面全閉）
- 三視圖（俯視、前視、側視）
- 邊界盒、對稱、形狀比較

場景座標系統（非常重要，先讀懂再回答）：
- x 軸 = 左右；z 軸 = 前後；y 軸 = 上下高度。每個方塊邊長 1。
- y = 0 那一層的下面就是「地面 / 池底」，是實心的，水不會漏。
- 系統會在下方提供一張「俯視高度圖」，每一格的數字代表該位置往上堆了幾個方塊。
  例如數字 1 表示該位置只有 1 個方塊（高 1），"." 代表該位置沒有方塊，是露天的空地。
- 中間一片 "." 而四周都是 ≥1 的數字 → 那是個「水池」型結構，水會被四周的牆圍住。

兩個容易混淆的概念，務必分清楚：
- **可裝水量 / 水池體積（poolVolume）**：把結構當作容器，從上方注水會留下多少水。
  四面有牆、上面開口也算，水位 = 最低牆頭高度，水會從最低處溢出。學生說「圍起來的體積」「裝多少水」「中間圍住的空間」時，**預設指這個**。
- **完全封閉的空間（enclosedVolume）**：六面（包含上方頂蓋）都被方塊堵住、外面進不去的空格。需要有屋頂才會增加。
- 除非學生明確問「六面都封住的內部」，否則一律用 poolVolume 來解釋「圍起來」。

教學原則（必須遵守）：
1. 用繁體中文回答，語氣親切、具體、有引導性。
2. **不要直接給出最終答案**。先讀俯視高度圖，描述你看到的形狀（例如「我看到中間有一個 2×2 的空地，四周圍著一圈高 1 的牆」），再用提問引導學生思考一個小步驟。
3. 學生答錯時，溫和指出問題並再給一個提示。
4. 涉及具體計數時，可以用下方系統提供的數字作為事實依據，但要鼓勵學生自己從俯視圖數出來。
5. 解釋表面積時，提醒學生「方塊與方塊相鄰的面會被遮住，不算入表面積」。
6. 解釋水池體積時，引導：「中間每一格的水可以積到多高？要看四周最低的牆有多高。」
7. 適度使用 Markdown：**粗體**、- 列表、## 小標題。
8. 數學公式必須用 KaTeX 格式：行內用單個 $…$，獨立式用雙 $$…$$；不可使用 \\( \\) 或 \\[ \\]。
9. 回答保持簡短（通常 2–5 句），需要時再展開。`;

  if (!state) return base;

  const { cubeCount, surfaceArea, enclosedVolume, poolVolume, views, bbox, mode, tool } = state;
  const stateBlock = `
============================
目前場景狀態（系統自動量測，僅供你內部參考；除非學生問到，否則不要直接念出全部數字）：
- 模式：${mode}（目前工具：${tool}）
- 方塊總數（體積）：${cubeCount} 立方單位
- 表面積：${surfaceArea} 平方單位
- 可裝水量 poolVolume（底面為地面）：${poolVolume} 立方單位  ← 「圍起來的體積」預設用這個
- 完全包圍的空格數 enclosedVolume（六面都需要有牆或頂）：${enclosedVolume} 立方單位
- 三視圖可見格數：俯視 ${views.top}、前視 ${views.front}、側視 ${views.side}
- 邊界盒：寬 ${bbox.width} × 高 ${bbox.height} × 深 ${bbox.depth}＝${bbox.bboxVolume} 立方單位

${describeCubes(state.cubes)}
============================`;
  return base + "\n" + stateBlock;
}

export async function POST(req: Request) {
  try {
    const { messages, sceneState } = (await req.json()) as {
      messages: UIMessage[];
      sceneState?: SceneState;
    };

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
      system: buildSystemPrompt(sceneState ?? null),
      messages: uiMessagesToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[volume-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
