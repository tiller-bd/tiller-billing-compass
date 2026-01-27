// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

export async function POST() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const cookieStore = await cookies();

    // Clear the auth session cookie
    cookieStore.set("auth_session", "", {
      httpOnly: true,
      secure: false, // Set to true when using HTTPS in production
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
