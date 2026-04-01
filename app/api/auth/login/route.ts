import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
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
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json({ error: "用戶名或密碼錯誤" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      return NextResponse.json({ error: "用戶名或密碼錯誤" }, { status: 401 });
    }

    await createSession({
      userId: (user._id as { toString(): string }).toString(),
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      subjects: user.subjects ?? [],
    });

    return NextResponse.json({
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      subjects: user.subjects ?? [],
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
