import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import "@/models/School";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "用戶名和密碼不能為空" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ username: username.toLowerCase().trim() }).populate(
      "school",
      "name code active enabledSubjects"
    );

    if (!user) {
      return NextResponse.json({ error: "用戶名或密碼錯誤" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      return NextResponse.json({ error: "用戶名或密碼錯誤" }, { status: 401 });
    }

    // Non-admin users must belong to an active school.
    const school = user.school as unknown as
      | { _id: { toString(): string }; name: string; active: boolean }
      | null;
    if (user.role !== "admin") {
      if (!school) {
        return NextResponse.json({ error: "帳戶未綁定學校，請聯絡管理員" }, { status: 403 });
      }
      if (!school.active) {
        return NextResponse.json({ error: "學校已停用，請聯絡管理員" }, { status: 403 });
      }
    }

    await createSession({
      userId: (user._id as { toString(): string }).toString(),
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      schoolId: school ? school._id.toString() : null,
      schoolName: school ? school.name : null,
      subjects: user.subjects ?? [],
    });

    return NextResponse.json({
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      schoolId: school ? school._id.toString() : null,
      schoolName: school ? school.name : null,
      subjects: user.subjects ?? [],
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
