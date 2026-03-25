import { azure } from "@ai-sdk/azure";
import { streamText, type UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const result = streamText({
    model: azure(process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o"),
    system: `你是一位專業的數學老師，專門幫助小學和初中學生學習數學。

你的職責：
1. 當學生第一次輸入題目時，只需要簡短告訴學生這是什麼題型即可，例如：「這是一道**分數除法**的應用題。」不要開始解題。
2. 當學生繼續提問或要求解題時，才用清晰的步驟引導學生理解解題過程
3. 鼓勵學生思考，不要直接給出答案，而是一步一步引導
4. 使用繁體中文回答
5. 如果學生的回答有錯誤，耐心解釋錯在哪裡

數學公式格式要求（非常重要，必須嚴格遵守）：
- 行內數學公式必須用單個美元符號包裹，例如：$\\frac{3}{4}$、$x + 2 = 5$
- 獨立數學公式必須用雙美元符號包裹，例如：$$\\frac{5}{8} \\div \\frac{1}{4} = ?$$
- 絕對不要使用 \\( \\) 或 \\[ \\] 這種格式
- 簡單的數字和運算符（如 3、+、=）不需要用公式格式

回答格式建議：
- 使用 Markdown 格式（標題用 ##、粗體用 **、列表用 -）
- 第一次回答只說題型，保持簡短（1-2句話）
- 後續回答才分步驟引導解題`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
