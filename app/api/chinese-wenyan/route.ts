import { azure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";
import { CHINESE_WENYAN_TRANSLATION_SYSTEM_PROMPT } from "@/lib/chinese-prompts";
import { after } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { TokenUsage } from "@/models/TokenUsage";

const schema = z.object({
  rating: z
    .enum(["excellent", "good", "needs_improvement"])
    .describe("翻譯的整體評級"),
  feedback: z
    .string()
    .describe("給學生的鼓勵與具體建議，先讚後改，80 字以內"),
  suggestion: z
    .string()
    .describe("一句通順、淺白的參考白話翻譯，供學生對照"),
});

export async function POST(req: Request) {
  const endpoint = "/api/chinese-wenyan";

  try {
    const { original, reference, studentTranslation } = (await req.json()) as {
      original?: string;
      reference?: string;
      studentTranslation?: string;
    };

    if (!original || !studentTranslation || !studentTranslation.trim()) {
      return Response.json(
        { error: "請先輸入你的翻譯" },
        { status: 400 }
      );
    }

    const session = await getSession().catch(() => null);
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1";

    const result = await generateObject({
      model: azure(deploymentName),
      schema,
      system: CHINESE_WENYAN_TRANSLATION_SYSTEM_PROMPT,
      prompt: `文言文原句：「${original}」

參考翻譯：「${reference ?? ""}」

學生的翻譯：「${studentTranslation.trim()}」

請檢測學生的翻譯，給出評級、鼓勵與建議。`,
    });

    after(async () => {
      try {
        if (!session) return;
        const usage = result.usage;
        if (!usage) return;
        await connectDB();
        await TokenUsage.create({
          userId: session.userId,
          username: session.username,
          subject: "chinese",
          modelName: deploymentName,
          promptTokens: Math.max(0, (usage.inputTokens ?? 0) - (usage.cachedInputTokens ?? 0)),
          cachedInputTokens: usage.cachedInputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
          totalTokens:
            usage.totalTokens ??
            ((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)),
          endpoint,
        });
      } catch (err) {
        console.error("[chinese-wenyan] Failed to record token usage:", err);
      }
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("[chinese-wenyan] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
