import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let dir: string;
let saveImage: typeof import("@/lib/images").saveImage;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "bk-img-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir); // UPLOAD_DIR is derived from cwd
  ({ saveImage } = await import("@/lib/images"));
});
afterAll(() => { vi.restoreAllMocks(); rmSync(dir, { recursive: true, force: true }); });

const file = (data: Buffer | string, name = "x.jpg", type = "image/jpeg") => new File([data as BlobPart], name, { type });
const jpeg = (w = 100, h = 80) => sharp({ create: { width: w, height: h, channels: 3, background: "#c33" } }).jpeg().withMetadata({ exif: { IFD0: { Copyright: "secret" } } }).toBuffer();

describe("saveImage", () => {
  it("rejects files that are not images even if they claim to be", async () => {
    await expect(saveImage(file("<?php echo 1; ?>", "shell.jpg"))).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(saveImage(file("GIF89a....", "a.gif", "image/gif"))).rejects.toThrow(/JPEG, PNG or WebP/);
  });
  it("rejects photos over 5 MB", async () => {
    await expect(saveImage(file(Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)))).rejects.toThrow(/under 5 MB/);
  });
  it("rejects corrupt images that only have a valid header", async () => {
    await expect(saveImage(file(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0])))).rejects.toThrow(/could not be read/);
  });
  it("re-encodes to webp under a random name, strips metadata and caps the size", async () => {
    const url = await saveImage(file(await jpeg(3000, 2000)));
    expect(url).toMatch(/^\/uploads\/[a-f0-9]{24}\.webp$/);
    const saved = readFileSync(path.join(dir, url));
    const meta = await sharp(saved).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(1600);
    expect(meta.exif).toBeUndefined();
    expect(readdirSync(path.join(dir, "uploads"))).toHaveLength(1);
  });
});
