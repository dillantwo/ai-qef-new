import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User, ALL_SUBJECTS, type Subject, type UserRole } from "@/models/User";
import { School } from "@/models/School";
import { requireAdmin } from "@/lib/admin-auth";

function sanitizeSubjects(input: unknown): Subject[] {
  if (!Array.isArray(input)) return [];
  return input.filter((s): s is Subject => ALL_SUBJECTS.includes(s as Subject));
}

type PopulatedSchool = { _id: { toString(): string }; name: string } | null;

// GET /api/admin/users?school=<id>&role=<role>&q=<search>
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "需要管理員權限" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const filter: Record<string, unknown> = {};

  const school = searchParams.get("school");
  if (school) filter.school = school;

  const role = searchParams.get("role");
  if (role && ["admin", "teacher", "student"].includes(role)) filter.role = role;

  const q = searchParams.get("q");
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ username: rx }, { displayName: rx }];
  }

  const users = await User.find(filter)
    .populate("school", "name code")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    users.map((u) => {
      const s = u.school as unknown as PopulatedSchool;
      return {
        id: String(u._id),
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        schoolId: s ? s._id.toString() : null,
        schoolName: s ? s.name : null,
        subjects: u.subjects ?? [],
        createdAt: u.createdAt,
      };
    })
  );
}

// POST /api/admin/users — create a teacher/student/admin
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "需要管理員權限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const username = (body.username ?? "").toString().trim().toLowerCase();
    const password = (body.password ?? "").toString();
    const displayName = (body.displayName ?? "").toString().trim();
    const role = body.role as UserRole;

    if (!username || !password || !displayName) {
      return NextResponse.json({ error: "用戶名、密碼和顯示名稱不能為空" }, { status: 400 });
    }
    if (!["admin", "teacher", "student"].includes(role)) {
      return NextResponse.json({ error: "角色無效" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少需要 6 個字元" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "用戶名已存在" }, { status: 409 });
    }

    let schoolId: string | null = null;
    let subjects: Subject[] = [];

    if (role === "admin") {
      // Admins are global and have no school / subjects.
      schoolId = null;
      subjects = [];
    } else {
      schoolId = (body.school ?? "").toString() || null;
      if (!schoolId) {
        return NextResponse.json({ error: "老師和學生必須綁定學校" }, { status: 400 });
      }
      const school = await School.findById(schoolId);
      if (!school) {
        return NextResponse.json({ error: "學校不存在" }, { status: 400 });
      }
      // Subjects must be a subset of what the school has enabled.
      const requested = sanitizeSubjects(body.subjects);
      subjects = requested.filter((s) => school.enabledSubjects.includes(s));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      hashedPassword,
      displayName,
      role,
      school: schoolId,
      subjects,
    });

    return NextResponse.json(
      {
        id: String(user._id),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        schoolId,
        subjects: user.subjects,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/users:POST]", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
