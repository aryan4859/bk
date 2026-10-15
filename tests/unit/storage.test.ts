import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const sent: { input: Record<string, unknown>; config: Record<string, unknown> }[] = [];
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { cfg: Record<string, unknown>; constructor(cfg: Record<string, unknown>) { this.cfg = cfg; } async send(cmd: { input: Record<string, unknown> }) { sent.push({ input: cmd.input, config: this.cfg }); return {}; } },
  PutObjectCommand: class { input: Record<string, unknown>; constructor(input: Record<string, unknown>) { this.input = input; } },
}));

import { putPhoto, r2Config } from "@/lib/storage";

const R2 = { R2_ACCOUNT_ID: "acc123", R2_ACCESS_KEY_ID: "AK", R2_SECRET_ACCESS_KEY: "SK", R2_BUCKET: "sawari-photos", R2_PUBLIC_URL: "https://pub-abc.r2.dev/" };
afterEach(() => { vi.unstubAllEnvs(); sent.length = 0; });

describe("r2Config", () => {
  it("is off when nothing is set", () => {
    expect(r2Config({})).toBeNull();
  });
  it("refuses a half-filled setup instead of quietly using a disk that gets wiped", () => {
    expect(() => r2Config({ R2_ACCOUNT_ID: "a", R2_BUCKET: "b" })).toThrow(/Missing: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL/);
  });
  it("derives the R2 endpoint and trims the public URL", () => {
    expect(r2Config(R2)).toMatchObject({ endpoint: "https://acc123.r2.cloudflarestorage.com", publicUrl: "https://pub-abc.r2.dev", bucket: "sawari-photos" });
  });
});

describe("putPhoto", () => {
  it("uploads to R2 with the right key, type and long cache, and returns the public URL", async () => {
    for (const [k, v] of Object.entries(R2)) vi.stubEnv(k, v);
    const url = await putPhoto("abc.webp", Buffer.from("img"), "image/webp");
    expect(url).toBe("https://pub-abc.r2.dev/abc.webp");
    expect(sent).toHaveLength(1);
    expect(sent[0].input).toMatchObject({ Bucket: "sawari-photos", Key: "abc.webp", ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" });
    expect(sent[0].config).toMatchObject({ region: "auto", endpoint: "https://acc123.r2.cloudflarestorage.com", credentials: { accessKeyId: "AK", secretAccessKey: "SK" } });
  });
  it("falls back to the local uploads folder when R2 is not configured", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "bk-store-"));
    vi.resetModules();
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(dir);
    const { putPhoto: put } = await import("@/lib/storage");
    expect(await put("x.webp", Buffer.from("hello"), "image/webp")).toBe("/uploads/x.webp");
    expect(readFileSync(path.join(dir, "uploads", "x.webp"), "utf8")).toBe("hello");
    expect(sent).toHaveLength(0);
    cwd.mockRestore();
    rmSync(dir, { recursive: true, force: true });
  });
});
