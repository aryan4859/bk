import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in", description: "Log in or sign up with a one-time code sent to your email.", robots: { index: false } };

export default async function Login({ searchParams }: PageProps<"/login">) {
  const next = (await searchParams).next;
  const dest = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getUser()) redirect(dest);
  return (
    <div className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <h1 className="text-4xl">Log in or sign up</h1>
      <p className="mt-3 text-muted">We email you a 6-digit code. No password needed.</p>
      <LoginForm next={dest} />
    </div>
  );
}
