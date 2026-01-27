// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive account" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { password_hash, ...safeUser } = user;

    // Set a session cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_session", JSON.stringify(safeUser), {
      httpOnly: true, // Prevents JS access
      secure: false, // Set to true when using HTTPS in production
      sameSite: "lax", // "strict" can cause issues with redirects; "lax" is safer for HTTP
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
