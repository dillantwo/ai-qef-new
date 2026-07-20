import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { PodcastRecording } from "@/models/PodcastRecording";

// Audio is stored inline as a base64 data URL. MongoDB documents are capped at
// 16MB, so we keep a comfortable ceiling well below that for a single recording.
const MAX_AUDIO_CHARS = 9 * 1024 * 1024; // ~9MB of base64 (~6.7MB of audio)

function unauthorized() {
  return new Response(JSON.stringify({ error: "未登錄" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

interface RecordingDoc {
  recordingId: string;
  topic: string;
  title: string;
  script?: string;
  audioData?: string;
  mimeType?: string;
  durationSec?: number;
  sizeBytes?: number;
  createdAt: Date;
  updatedAt: Date;
}

function serialize(doc: RecordingDoc, includeAudio: boolean) {
  return {
    id: String(doc.recordingId),
    topic: String(doc.topic),
    title: String(doc.title),
    script: doc.script ?? "",
    mimeType: doc.mimeType ?? "audio/webm",
    durationSec: doc.durationSec ?? 0,
    sizeBytes: doc.sizeBytes ?? 0,
    ...(includeAudio ? { audioData: doc.audioData ?? "" } : {}),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(req.url);
    const recordingId = searchParams.get("recordingId")?.trim();

    // Fetch a single recording including its (heavy) audio payload.
    if (recordingId) {
      const doc = await PodcastRecording.findOne({
        userId: session.userId,
        recordingId,
      }).lean<RecordingDoc | null>();
      return Response.json({ item: doc ? serialize(doc, true) : null });
    }

    // List recordings without the audio payload to keep the response light.
    const topic = searchParams.get("topic")?.trim();
    const docs = await PodcastRecording.find({
      userId: session.userId,
      ...(topic ? { topic } : {}),
    })
      .select("-audioData")
      .sort({ updatedAt: -1 })
      .lean<RecordingDoc[]>();

    return Response.json({ items: docs.map((d) => serialize(d, false)) });
  } catch (error) {
    console.error("[humanities-podcast] GET Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { id, topic, title, script, audioData, mimeType, durationSec, sizeBytes } =
      (await req.json()) as {
        id?: string;
        topic?: string;
        title?: string;
        script?: string;
        audioData?: string;
        mimeType?: string;
        durationSec?: number;
        sizeBytes?: number;
      };

    if (!id || !topic) return badRequest("id and topic are required");
    if (!audioData || !audioData.startsWith("data:")) {
      return badRequest("audioData (a base64 data URL) is required");
    }
    if (audioData.length > MAX_AUDIO_CHARS) {
      return badRequest("錄音檔案太大了，請錄製較短的片段（約 5 分鐘以內）。");
    }

    await connectDB();

    const doc = await PodcastRecording.findOneAndUpdate(
      { userId: session.userId, recordingId: id },
      {
        $set: {
          userId: session.userId,
          recordingId: id,
          topic: topic.trim(),
          title: (title?.trim() || "未命名播客").slice(0, 80),
          script: (script ?? "").slice(0, 5000),
          audioData,
          mimeType: mimeType?.trim() || "audio/webm",
          durationSec: Math.max(0, Math.round(durationSec ?? 0)),
          sizeBytes: Math.max(0, Math.round(sizeBytes ?? 0)),
        },
      },
      { returnDocument: "after", upsert: true },
    );

    return Response.json({ item: { id: String(doc.recordingId), updatedAt: doc.updatedAt } });
  } catch (error) {
    console.error("[humanities-podcast] POST Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const recordingId = searchParams.get("recordingId")?.trim();
    if (!recordingId) return badRequest("recordingId is required");

    await connectDB();
    await PodcastRecording.deleteOne({ userId: session.userId, recordingId });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[humanities-podcast] DELETE Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
