import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SESSION_COOKIE = "a360_session";
const ONE_DAY = 60 * 60 * 24;

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = bodySchema.parse(body);

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = process.env.SESSION_TOKEN;

    if (!expectedUsername || !expectedPassword || !sessionToken) {
      return NextResponse.json(
        { error: "Auth not configured on server" },
        { status: 500 },
      );
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_DAY * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
