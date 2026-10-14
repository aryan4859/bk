"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return false;
      }
      return true;
    } catch {
      setError("Network error. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (await post("/api/auth/request-otp", { email })) setStep("code");
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code"));
    if (await post("/api/auth/verify-otp", { email, code })) {
      router.replace(next);
      router.refresh();
    }
  }

  return step === "email" ? (
    <form onSubmit={sendCode} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input id="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@gmail.com" />
      </div>
      {error && <p className="text-sm text-brand">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "Sending…" : "Send code"}</button>
    </form>
  ) : (
    <form onSubmit={verify} className="mt-6 space-y-4">
      <p className="text-sm text-muted">We sent a code to <b className="text-ink">{email}</b>.</p>
      <div>
        <label htmlFor="code" className="label">6-digit code</label>
        <input id="code" name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className="input text-center text-xl tracking-[0.4em]" />
      </div>
      {error && <p className="text-sm text-brand">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "Checking…" : "Log in"}</button>
      <button type="button" onClick={() => { setStep("email"); setError(""); }} className="w-full text-sm text-muted hover:text-ink">
        Use a different email
      </button>
    </form>
  );
}
