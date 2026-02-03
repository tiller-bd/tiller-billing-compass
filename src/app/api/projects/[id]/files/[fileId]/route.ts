import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id, fileId } = await params;
    const body = await request.json();

    const file = await prisma.projectFile.findFirst({
      where: { id: parseInt(fileId), projectId: parseInt(id) },
      select: { id: true },
    });
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updated = await prisma.projectFile.update({
      where: { id: file.id },
      data: { title: body.title },
      select: {
        id: true,
        projectId: true,
        title: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id, fileId } = await params;

    const file = await prisma.projectFile.findFirst({
      where: { id: parseInt(fileId), projectId: parseInt(id) },
      select: { id: true },
    });
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await prisma.projectFile.delete({ where: { id: file.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
