import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getAbsolutePath } from "@/lib/file-storage";
import { promises as fs } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id, fileId } = await params;

    const file = await prisma.projectFile.findFirst({
      where: { id: parseInt(fileId), projectId: parseInt(id) },
    });
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const absolutePath = getAbsolutePath(file.filePath);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch {
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 }
      );
    }

    const isDownload =
      request.nextUrl.searchParams.get("download") === "true";
    const disposition = isDownload
      ? `attachment; filename="${file.fileName}"`
      : `inline; filename="${file.fileName}"`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
