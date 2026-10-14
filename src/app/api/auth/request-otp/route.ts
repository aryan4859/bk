import { randomInt } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { hashCode } from "@/lib/otp";

const body = z.object({ email: z.string().email().toLowerCase() });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid email" }, { status: 400 });
  const { email } = parsed.data;

  const recent = await db.otp.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent > 0) return Response.json({ error: "Wait a minute before retrying" }, { status: 429 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otp.deleteMany({ where: { email } });
  await db.otp.create({
    data: { email, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  try {
    await sendMail(email, "Your test login code", `Your code is ${code}. It expires in 10 minutes.`);
  } catch (e) {
    console.error("OTP email failed:", (e as { response?: { data?: unknown } }).response?.data ?? (e as Error).message);
    await db.otp.deleteMany({ where: { email } });
    return Response.json({ error: "We could not send the email. Please try again later." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
