import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { PodcastRecording } from "@/models/PodcastRecording";
import { User } from "@/models/User";

const DEFAULT_TOPIC = "anti-japanese-war";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toObjectId(id: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

interface RecDoc {
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

function serializeMeta(doc: RecDoc) {
  return {
    id: String(doc.recordingId),
    topic: String(doc.topic),
    title: String(doc.title),
    script: doc.script ?? "",
    mimeType: doc.mimeType ?? "audio/webm",
    durationSec: doc.durationSec ?? 0,
    sizeBytes: doc.sizeBytes ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("未登錄", 401);
    if (session.role !== "teacher") return jsonError("僅教師可查看學生記錄", 403);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic")?.trim() || DEFAULT_TOPIC;
    const studentId = searchParams.get("studentId")?.trim();
    const recordingId = searchParams.get("recordingId")?.trim();

    const schoolId = session.schoolId ? toObjectId(session.schoolId) : null;
    if (!schoolId) {
      // Teachers must belong to a school to review students.
      return Response.json({ students: [] });
    }

    // Confirm a target student exists and belongs to the teacher's school
    // before exposing any of their recordings.
    async function assertStudentInSchool(id: string) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      return User.findOne({ _id: objectId, role: "student", school: schoolId })
        .select({ displayName: 1, username: 1 })
        .lean<{ _id: mongoose.Types.ObjectId; displayName: string; username: string } | null>();
    }

    // --- A single recording (with audio) for playback ---
    if (studentId && recordingId) {
      const student = await assertStudentInSchool(studentId);
      if (!student) return jsonError("找不到該學生", 404);

      const doc = await PodcastRecording.findOne({
        userId: studentId,
        recordingId,
        topic,
      }).lean<RecDoc | null>();
      if (!doc) return jsonError("找不到該錄音", 404);

      return Response.json({ item: { ...serializeMeta(doc), audioData: doc.audioData ?? "" } });
    }

    // --- One student's recordings (metadata only) ---
    if (studentId) {
      const student = await assertStudentInSchool(studentId);
      if (!student) return jsonError("找不到該學生", 404);

      const docs = await PodcastRecording.find({ userId: studentId, topic })
        .select("-audioData")
        .sort({ updatedAt: -1 })
        .lean<RecDoc[]>();

      return Response.json({
        student: {
          id: studentId,
          displayName: String(student.displayName),
          username: String(student.username),
        },
        items: docs.map(serializeMeta),
      });
    }

    // --- List students (in this school) who have podcast recordings ---
    const grouped = await PodcastRecording.aggregate<{
      _id: string;
      count: number;
      lastUpdatedAt: Date;
    }>([
      { $match: { topic } },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          lastUpdatedAt: { $max: "$updatedAt" },
        },
      },
    ]);

    const objectIds = grouped
      .map((g) => toObjectId(g._id))
      .filter((id): id is mongoose.Types.ObjectId => id !== null);

    const students = await User.find({
      _id: { $in: objectIds },
      role: "student",
      school: schoolId,
    })
      .select({ displayName: 1, username: 1 })
      .lean<{ _id: mongoose.Types.ObjectId; displayName: string; username: string }[]>();

    const statsByUserId = new Map(grouped.map((g) => [g._id, g]));

    const items = students
      .map((s) => {
        const id = String(s._id);
        const stats = statsByUserId.get(id);
        return {
          id,
          displayName: String(s.displayName),
          username: String(s.username),
          count: stats?.count ?? 0,
          lastUpdatedAt: stats?.lastUpdatedAt ?? null,
        };
      })
      .sort((a, b) => {
        const at = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
        const bt = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
        return bt - at;
      });

    return Response.json({ students: items });
  } catch (error) {
    console.error("[humanities-podcast/teacher] GET Error:", error);
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
