const FLOWISE_API_URL = process.env.FLOWISE_API_URL || "";
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
  images?: { mediaType: string; data: string }[];
};

export async function POST(req: Request) {
  try {
    if (!FLOWISE_API_URL) {
      return new Response(
        JSON.stringify({ error: "FLOWISE_API_URL is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId } = (await req.json()) as {
      messages: ChatMessage[];
      sessionId?: string;
    };

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return new Response(JSON.stringify({ error: "No user message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "apiMessage" : "userMessage",
      content: m.text,
    }));

    const uploads = (lastUser.images ?? []).map((img, i) => ({
      data: img.data.startsWith("data:") ? img.data : `data:${img.mediaType};base64,${img.data}`,
      type: "file",
      name: `image-${i}.${(img.mediaType.split("/")[1] || "png")}`,
      mime: img.mediaType,
    }));

    const flowisePayload: Record<string, unknown> = {
      question: lastUser.text || "（見圖片）",
      streaming: true,
      history,
    };
    if (sessionId) {
      flowisePayload.overrideConfig = { sessionId };
    }
    if (uploads.length > 0) {
      flowisePayload.uploads = uploads;
    }

    const upstream = await fetch(FLOWISE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(FLOWISE_API_KEY && { Authorization: `Bearer ${FLOWISE_API_KEY}` }),
        Accept: "text/event-stream",
      },
      body: JSON.stringify(flowisePayload),
      cache: "no-cache",
    });

    if (!upstream.ok || !upstream.body) {
      const errorBody = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: `Flowise API error: ${upstream.status} ${upstream.statusText}${
            errorBody ? ` - ${errorBody}` : ""
          }`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";

    // If Flowise returned plain JSON (streaming disabled or fallback),
    // convert it into a single chunk text stream so the client can read it
    // the same way as a streamed response.
    if (!contentType.includes("text/event-stream")) {
      const json = await upstream.json().catch(() => null);
      const text =
        (json && (json.text || json.answer || json.message)) ||
        (typeof json === "string" ? json : "") ||
        "";
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Parse the SSE stream from Flowise and re-emit only the token text as
    // a plain text/plain chunked stream, which is simple to consume on the
    // client side.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = "";

        const handleEvent = (rawEvent: string) => {
          // Each SSE event is a block of lines; we only care about data: lines.
          const dataLines = rawEvent
            .split(/\r?\n/)
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trimStart());
          if (dataLines.length === 0) return;
          const dataStr = dataLines.join("\n");
          if (!dataStr || dataStr === "[DONE]") return;
          try {
            const evt = JSON.parse(dataStr);
            // Flowise uses { event: "token", data: "..." } among other events.
            if (evt && (evt.event === "token" || evt.event === "stream")) {
              if (typeof evt.data === "string" && evt.data.length > 0) {
                controller.enqueue(encoder.encode(evt.data));
              }
            } else if (evt && evt.event === "error") {
              const msg =
                typeof evt.data === "string" ? evt.data : JSON.stringify(evt.data);
              controller.enqueue(encoder.encode(`\n[error] ${msg}`));
            }
            // Ignore start, end, metadata, sourceDocuments, etc.
          } catch {
            // Some Flowise versions emit raw text in `data:` lines.
            controller.enqueue(encoder.encode(dataStr));
          }
        };

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // SSE events are separated by blank lines. Handle both \n\n and \r\n\r\n.
            const re = /\r?\n\r?\n/;
            let match: RegExpExecArray | null;
            while ((match = re.exec(buffer))) {
              const rawEvent = buffer.slice(0, match.index);
              buffer = buffer.slice(match.index + match[0].length);
              handleEvent(rawEvent);
            }
          }
          if (buffer.trim().length > 0) {
            handleEvent(buffer);
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `\n[error] ${err instanceof Error ? err.message : String(err)}`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[chinese-chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
