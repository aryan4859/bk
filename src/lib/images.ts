import { randomBytes } from "crypto";
import sharp from "sharp";
import { MAX_IMAGE_BYTES } from "./constants";
import { putPhoto } from "./storage";

export { UPLOAD_DIR } from "./storage";

const EXT: Record<string, [string, number[]]> = {
  "image/jpeg": ["jpg", [0xff, 0xd8, 0xff]],
  "image/png": ["png", [0x89, 0x50, 0x4e, 0x47]],
  "image/webp": ["webp", [0x52, 0x49, 0x46, 0x46]],
};

export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Validates by magic bytes (not the client-claimed type), re-encodes and stores it (R2 in production). Returns its URL. */
export async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Each photo must be under 5 MB");
  const buf = Buffer.from(await file.arrayBuffer());
  const entry = Object.values(EXT).find(([, magic]) => magic.every((b, i) => buf[i] === b));
  if (!entry) throw new Error("Photos must be JPEG, PNG or WebP");
  // Re-encode: caps the size, shrinks the file and drops metadata such as GPS location.
  let out: Buffer;
  try {
    out = await sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw new Error("That photo could not be read. Try a different file.");
  }
  const name = `${randomBytes(12).toString("hex")}.webp`;
  try {
    return await putPhoto(name, out, "image/webp");
  } catch (e) {
    console.error("photo upload failed:", (e as Error).message);
    throw new Error("We could not save your photos. Please try again in a minute.");
  }
}
