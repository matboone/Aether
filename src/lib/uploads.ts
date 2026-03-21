import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { env } from "@/src/lib/env";

export async function ensureUploadDir(): Promise<string> {
  const uploadDir = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    env.uploadDir(),
  );
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export async function saveUploadedFile(file: File): Promise<{
  storagePath: string;
  checksum: string;
}> {
  const uploadDir = await ensureUploadDir();
  const bytes = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const storagePath = path.join(uploadDir, filename);

  await writeFile(storagePath, bytes);

  return { storagePath, checksum };
}

export async function readUploadAsBuffer(storagePath: string): Promise<Buffer> {
  return readFile(storagePath);
}

export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    await stat(storagePath);
    return true;
  } catch {
    return false;
  }
}
