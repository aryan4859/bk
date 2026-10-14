import { cookies } from "next/headers";

export type Flash = { id: string; msg: string; tone: "ok" | "error" };

/** One-shot message shown as a toast on the next render. Cleared by the client once displayed. */
export async function flash(msg: string, tone: Flash["tone"] = "ok") {
  const value: Flash = { id: Date.now().toString(36), msg, tone };
  (await cookies()).set("flash", encodeURIComponent(JSON.stringify(value)), { path: "/", maxAge: 60, sameSite: "lax" });
}

export async function readFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get("flash")?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    return typeof v?.msg === "string" && typeof v?.id === "string" ? { id: v.id, msg: v.msg.slice(0, 200), tone: v.tone === "error" ? "error" : "ok" } : null;
  } catch {
    return null;
  }
}
