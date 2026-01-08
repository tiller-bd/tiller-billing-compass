import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
