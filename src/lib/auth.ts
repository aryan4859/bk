import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { getSessionUserId } from "./session";

/** The logged-in user, looked up once per request even though the layout, page and metadata all ask. */
export const getUser = cache(async () => {
  const id = await getSessionUserId();
  const user = id ? await db.user.findUnique({ where: { id } }) : null;
  return user && !user.banned ? user : null;
});

export async function requireUser(next = "/") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "ADMIN") redirect("/");
  return user;
}
