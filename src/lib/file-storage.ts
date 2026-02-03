import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

function getProjectDir(projectId: number): string {
  return path.join(UPLOADS_ROOT, "projects", String(projectId));
}

export async function saveFile(
  projectId: number,
  fileBuffer: Buffer,
  originalName: string
): Promise<{ relativePath: string; fileName: string }> {
  const dir = getProjectDir(projectId);
  await fs.mkdir(dir, { recursive: true });

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${randomUUID()}-${safeName}`;
  const filePath = path.join(dir, fileName);

  await fs.writeFile(filePath, fileBuffer);

  const relativePath = path.join("projects", String(projectId), fileName);
  return { relativePath, fileName };
}

export async function deleteFile(relativePath: string): Promise<void> {
  const absolute = getAbsolutePath(relativePath);
  await fs.unlink(absolute);
}

export function getAbsolutePath(relativePath: string): string {
  return path.join(UPLOADS_ROOT, relativePath);
}
