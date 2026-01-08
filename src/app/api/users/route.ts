// src/app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const users = await prisma.user.findMany({ orderBy: { created_at: "desc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { name, email, role, password } = await req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { full_name: name, email, role, password_hash: hashedPassword },
  });
  return NextResponse.json(user);
}
