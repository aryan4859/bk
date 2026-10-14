import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function Login({ searchParams }: PageProps<"/login">) {
  const next = (await searchParams).next;
  const dest = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getUser()) redirect(dest);
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Log in or sign up</h1>
      <p className="mt-2 text-muted">We email you a 6-digit code. No password needed.</p>
      <LoginForm next={dest} />
    </div>
  );
}
