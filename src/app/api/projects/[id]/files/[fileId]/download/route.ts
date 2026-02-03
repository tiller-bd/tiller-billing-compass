import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

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
      select: {
        fileName: true,
        fileData: true,
        fileSize: true,
        mimeType: true,
      },
    });
    if (!file || !file.fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const isDownload =
      request.nextUrl.searchParams.get("download") === "true";
    const disposition = isDownload
      ? `attachment; filename="${file.fileName}"`
      : `inline; filename="${file.fileName}"`;

    return new NextResponse(file.fileData, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": disposition,
        "Content-Length": String(file.fileSize),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
