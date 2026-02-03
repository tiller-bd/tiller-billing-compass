import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { saveFile, deleteFile } from "@/lib/file-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const projectId = parseInt(id);

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const projectId = parseInt(id);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const titlesRaw = formData.get("titles") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let titles: string[] = [];
    if (titlesRaw) {
      try {
        titles = JSON.parse(titlesRaw);
      } catch {
        return NextResponse.json(
          { error: "Invalid titles format" },
          { status: 400 }
        );
      }
    }

    if (titles.length && titles.length !== files.length) {
      return NextResponse.json(
        { error: "Titles count must match files count" },
        { status: 400 }
      );
    }

    // Validate files
    let totalSize = 0;
    for (const file of files) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `File "${file.name}" is not a PDF` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total upload size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Save files to disk and create DB records
    const savedPaths: string[] = [];
    const createdFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const { relativePath, fileName } = await saveFile(
          projectId,
          buffer,
          file.name
        );
        savedPaths.push(relativePath);

        const title =
          titles[i] || file.name.replace(/\.pdf$/i, "");

        const record = await prisma.projectFile.create({
          data: {
            projectId,
            title,
            fileName: file.name,
            filePath: relativePath,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
        createdFiles.push(record);
      }
    } catch (error) {
      // Clean up already-written files on failure
      for (const p of savedPaths) {
        try {
          await deleteFile(p);
        } catch {
          // ignore cleanup errors
        }
      }
      throw error;
    }

    return NextResponse.json(createdFiles, { status: 201 });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
