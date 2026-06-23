import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登錄" }, { status: 401 });
  }
  return NextResponse.json({
    username: session.username,
    role: session.role,
    displayName: session.displayName,
    schoolId: session.schoolId ?? null,
    schoolName: session.schoolName ?? null,
    subjects: session.subjects ?? [],
  });
}
