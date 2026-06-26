import { azure } from "@ai-sdk/azure";
import { streamText } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import {
  getEnglishReadingComprehensionPrompt,
  type ReadingId,
  type ReadingRole,
} from "@/lib/english-prompts";
import { after } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { TokenUsage } from "@/models/TokenUsage";

type InputImage = {
  mediaType: string;
  data: string;
};

type InputMessage = {
  role: "user" | "assistant";
  text: string;
  images?: InputImage[];
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mediaType: match[1],
    data: match[2],
  };
}

function toModelMessages(messages: InputMessage[]): ModelMessage[] {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return {
        role: "assistant",
        content: [{ type: "text", text: message.text }],
      };
    }

    const content: Array<
      | { type: "text"; text: string }
      | { type: "file"; mediaType: string; data: string }
    > = [];

    if (message.text.trim()) {
      content.push({ type: "text", text: message.text });
    }

    for (const image of message.images ?? []) {
      const parsed = parseDataUrl(image.data);
      if (!parsed) {
        continue;
      }

      content.push({
        type: "file",
        mediaType: parsed.mediaType || image.mediaType,
        data: parsed.data,
      });
    }

    return { role: "user", content };
  });
}

export async function POST(req: Request) {
  try {
    const { messages, role, reading } = (await req.json()) as {
      messages: InputMessage[];
      role?: ReadingRole | null;
      reading?: ReadingId | null;
    };

    const session = await getSession().catch(() => null);
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1";

    const result = streamText({
      model: azure(deploymentName),
      system: getEnglishReadingComprehensionPrompt(role, reading ?? "reading-1"),
      messages: toModelMessages(messages ?? []),
    });

    after(async () => {
      try {
        if (!session) return;
        const usage = await result.usage;
        if (!usage) return;
        await connectDB();
        await TokenUsage.create({
          userId: session.userId,
          username: session.username,
          subject: "english",
          modelName: deploymentName,
          promptTokens: Math.max(0, (usage.inputTokens ?? 0) - (usage.cachedInputTokens ?? 0)),
          cachedInputTokens: usage.cachedInputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
          totalTokens: usage.totalTokens ?? ((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)),
          endpoint: "/api/english-reading-comprehension",
        });
      } catch (err) {
        console.error("[english-reading-comprehension] Failed to record token usage:", err);
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[english-reading-comprehension] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
