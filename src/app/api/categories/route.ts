import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const categories = await prisma.projectCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}
