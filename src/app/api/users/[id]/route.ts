// src/app/api/users/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const data = await req.json();
  const user = await prisma.user.update({
    where: { id: parseInt(params.id) },
    data,
  });
  return NextResponse.json(user);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  await prisma.user.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
