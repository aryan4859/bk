import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/** Local fallback for development and tests. Not safe on hosts with a temporary disk (Render). */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const R2_VARS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"] as const;

type R2Config = { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; publicUrl: string; endpoint: string };

/** Cloudflare R2 settings, or null when none are set. A half-filled set is a mistake, so it throws instead of quietly using the disk. */
export function r2Config(env: Record<string, string | undefined> = process.env): R2Config | null {
  const set = R2_VARS.filter((k) => env[k]?.trim());
  if (set.length === 0) return null;
  if (set.length < R2_VARS.length) {
    throw new Error(`Photo storage is half configured. Missing: ${R2_VARS.filter((k) => !set.includes(k)).join(", ")}`);
  }
  const accountId = env.R2_ACCOUNT_ID!.trim();
  return {
    accountId,
    accessKeyId: env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!.trim(),
    bucket: env.R2_BUCKET!.trim(),
    publicUrl: env.R2_PUBLIC_URL!.trim().replace(/\/+$/, ""),
    // R2_ENDPOINT only exists so tests can point at a local S3 server
    endpoint: env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

let client: { key: string; s3: S3Client } | null = null;
function s3For(c: R2Config) {
  const key = `${c.endpoint}|${c.accessKeyId}`;
  if (client?.key !== key) {
    client = { key, s3: new S3Client({ region: "auto", endpoint: c.endpoint, forcePathStyle: true, credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey } }) };
  }
  return client.s3;
}

/** Stores a photo and returns the URL to save with the listing. */
export async function putPhoto(name: string, body: Buffer, contentType: string): Promise<string> {
  const r2 = r2Config();
  if (r2) {
    await s3For(r2).send(new PutObjectCommand({
      Bucket: r2.bucket,
      Key: name,
      Body: body,
      ContentType: contentType,
      // names are random and never reused, so browsers and the image optimizer may cache forever
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return `${r2.publicUrl}/${name}`;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), body);
  return `/uploads/${name}`;
}
