import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_TOKEN = "raiox-authenticated";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "AUTH_PASSWORD not set" }, { status: 500 });
  }

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN, process.env.AUTH_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
