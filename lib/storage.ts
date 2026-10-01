import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { uploadsDir } from "./db";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_LIBRARY_BYTES = 50 * 1024 * 1024;

/** Only allow plain file names (no folders, no "..") when reading uploads. */
export function safeName(name: string) {
  const base = path.basename(name);
  return /^[a-zA-Z0-9._-]+$/.test(base) && !base.startsWith(".") ? base : null;
}

function randomName(ext: string) {
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

/** Resize + convert an uploaded photo to WebP. Throws if the file is not an image. */
export async function saveImage(file: File): Promise<{ file: string; width: number; height: number }> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image is larger than 15 MB");
  const input = Buffer.from(await file.arrayBuffer());
  const out = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true });
  const name = randomName(".webp");
  fs.mkdirSync(uploadsDir("images"), { recursive: true });
  fs.writeFileSync(uploadsDir("images", name), out.data);
  return { file: name, width: out.info.width, height: out.info.height };
}

export async function saveLibrary(file: File): Promise<{ file: string; originalName: string; size: number }> {
  if (file.size > MAX_LIBRARY_BYTES) throw new Error("File is larger than 50 MB");
  if (file.size === 0) throw new Error("File is empty");
  const originalName = path.basename(file.name).replace(/[^\w.\- ()]+/g, "_").slice(0, 120) || "library";
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const name = randomName(ext);
  fs.mkdirSync(uploadsDir("library"), { recursive: true });
  fs.writeFileSync(uploadsDir("library", name), Buffer.from(await file.arrayBuffer()));
  return { file: name, originalName, size: file.size };
}

export async function saveConsoleLogo(consoleId: string, file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo is larger than 2 MB");
  const input = Buffer.from(await file.arrayBuffer());
  const out = await sharp(input, { failOn: "error" })
    .resize({ height: 160, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const name = `console-${consoleId}-${Date.now().toString(36)}.png`;
  fs.mkdirSync(uploadsDir("consoles"), { recursive: true });
  fs.writeFileSync(uploadsDir("consoles", name), out);
  return name;
}

export function removeUpload(folder: "images" | "library" | "consoles", name: string) {
  const safe = safeName(name);
  if (!safe) return;
  fs.rmSync(uploadsDir(folder, safe), { force: true });
}
