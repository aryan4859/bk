import { createHash } from "crypto";

export const hashCode = (email: string, code: string) =>
  createHash("sha256").update(`${email}:${code}:${process.env.AUTH_SECRET}`).digest("hex");
