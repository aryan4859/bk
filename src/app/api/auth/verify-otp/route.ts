import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { hashCode } from "@/lib/otp";

const body = z.object({ email: z.string().email().toLowerCase(), code: z.string().length(6) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const { email, code } = parsed.data;

  const otp = await db.otp.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5)
    return Response.json({ error: "Code expired. Request a new one." }, { status: 400 });

  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(hashCode(email, code));
  if (!timingSafeEqual(a, b)) {
    await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return Response.json({ error: "Wrong code" }, { status: 400 });
  }

  await db.otp.deleteMany({ where: { email } });
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.banned) return Response.json({ error: "This account has been suspended." }, { status: 403 });
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const role = admins.includes(email) ? "ADMIN" : "USER";
  const user = await db.user.upsert({ where: { email }, update: { role }, create: { email, role } });
  await createSession(user.id);
  return Response.json({ ok: true });
}
