import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { ChineseChatHistory } from "@/models/ChineseChatHistory";
import { User } from "@/models/User";

// Science topics are stored in the shared ChineseChatHistory collection,
// distinguished by their topic string.
const SCIENCE_TOPICS = ["science-circuit", "science-aerospace"];

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toObjectId(id: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("未登錄", 401);
    }
    if (session.role !== "teacher") {
      return jsonError("僅教師可查看學生記錄", 403);
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId")?.trim();
    const topic = searchParams.get("topic")?.trim();

    // --- Single student's chat history (optionally filtered by topic) ---
    if (studentId) {
      const objectId = toObjectId(studentId);
      const student = objectId
        ? await User.findOne({ _id: objectId, role: "student" })
            .select({ displayName: 1, username: 1 })
            .lean()
        : null;
      if (!student) {
        return jsonError("找不到該學生", 404);
      }

      const docs = await ChineseChatHistory.find({
        userId: studentId,
        topic: topic && SCIENCE_TOPICS.includes(topic) ? topic : { $in: SCIENCE_TOPICS },
      })
        .sort({ updatedAt: -1 })
        .lean();

      return Response.json({
        student: {
          id: studentId,
          displayName: String(student.displayName),
          username: String(student.username),
        },
        items: docs.map((doc) => ({
          id: String(doc.chatId),
          title: String(doc.title),
          topic: String(doc.topic),
          messages: Array.isArray(doc.messages) ? doc.messages : [],
          updatedAt: doc.updatedAt,
        })),
      });
    }

    // --- List students who have Science chat history ---
    const topicMatch =
      topic && SCIENCE_TOPICS.includes(topic) ? topic : { $in: SCIENCE_TOPICS };
    const grouped = await ChineseChatHistory.aggregate<{
      _id: string;
      count: number;
      lastUpdatedAt: Date;
    }>([
      { $match: { topic: topicMatch } },
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

    const students = await User.find({ _id: { $in: objectIds }, role: "student" })
      .select({ displayName: 1, username: 1 })
      .lean();

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
    console.error("[science-chat-history/teacher] GET Error:", error);
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
