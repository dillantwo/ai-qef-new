import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { ReadingRecord, type IReadingAnswer } from "@/models/ReadingRecord";
import { User } from "@/models/User";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toObjectId(id: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

// Turn a stored reading record into a readable markdown summary so the shared
// StudentHistoryDialog (which renders chat messages) can display it as-is.
// Turn a skill id like "activate-background" into a readable label.
function skillLabel(id: string): string {
  return id
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildSummary(
  score: number,
  total: number,
  completed: boolean,
  answers: IReadingAnswer[],
  skills: string[],
): string {
  const header = `**得分：${score} / ${total}**　·　${completed ? "已完成 ✅" : "未完成"}`;
  const skillsBlock = skills.length
    ? `\n\n**已使用的閱讀技巧：** ${skills.map(skillLabel).join("、")}`
    : "";
  if (!answers.length) {
    return `${header}${skillsBlock}\n\n_尚無作答記錄_`;
  }
  const rows = [...answers]
    .sort((a, b) => a.questionId - b.questionId)
    .map((a) => {
      const q = a.questionText ? a.questionText.replace(/\|/g, "\\|") : `Question ${a.questionId}`;
      return `| ${a.questionId} | ${q} | ${a.selected || "—"} | ${a.correct || "—"} | ${a.isCorrect ? "✅" : "❌"} |`;
    })
    .join("\n");
  return `${header}${skillsBlock}\n\n| 題號 | 題目 | 學生作答 | 正確答案 | 結果 |\n|---|---|---|---|---|\n${rows}`;
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

    // --- Single student's reading records ---
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

      const docs = await ReadingRecord.find({ userId: studentId })
        .sort({ updatedAt: -1 })
        .lean();

      return Response.json({
        student: {
          id: studentId,
          displayName: String(student.displayName),
          username: String(student.username),
        },
        items: docs.map((doc) => ({
          id: String(doc.readingId),
          title: `${String(doc.title)}（${doc.score ?? 0}/${doc.total ?? 0}）`,
          topic: "reading-comprehension",
          messages: [
            {
              id: `${String(doc.readingId)}-summary`,
              role: "assistant" as const,
              parts: [
                {
                  type: "text" as const,
                  text: buildSummary(
                    doc.score ?? 0,
                    doc.total ?? 0,
                    Boolean(doc.completed),
                    Array.isArray(doc.answers) ? doc.answers : [],
                    Array.isArray(doc.skills) ? doc.skills : [],
                  ),
                },
              ],
            },
          ],
          updatedAt: doc.updatedAt,
        })),
      });
    }

    // --- List students who have reading records ---
    const grouped = await ReadingRecord.aggregate<{
      _id: string;
      count: number;
      lastUpdatedAt: Date;
    }>([
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
    console.error("[english-reading-record/teacher] GET Error:", error);
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
