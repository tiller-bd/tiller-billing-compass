import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Change to Promise
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params; // Await params
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        department: true,
        category: true,
        bills: {
          orderBy: { tentativeBillingDate: "asc" },
        },
      },
    });

    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
