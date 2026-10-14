import { readFile } from "fs/promises";
import path from "path";
import { MIME, UPLOAD_DIR } from "@/lib/images";

export async function GET(_: Request, { params }: RouteContext<"/uploads/[name]">) {
  const { name } = await params;
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(buf, {
      headers: {
        "content-type": MIME[name.split(".")[1]],
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
