"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ListingCard } from "@/lib/assistant/tools";
import { formatKm, formatNpr } from "@/lib/format";
import { Icon } from "./Icon";
import { SafeImage } from "./SafeImage";

type Turn = { role: "user" | "assistant"; content: string; listings?: ListingCard[]; error?: boolean };

const KEY = "assistant";
const GREETED = "assistant-greeted";
const GREET_AFTER_MS = 5500;
const GREET_FOR_MS = 15000;
const STARTERS = ["Scooter under 2 lakh in Pokhara", "How do I sell my bike here?", "Is it safe to pay the seller in advance?"];

const load = (): Turn[] => {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.slice(-30) : []; } catch { return []; }
};

/** The "Ask Sawari" chat: a floating button that opens a panel (a full-screen sheet on phones). */
export function Assistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { setTurns(load()); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- read the visit's chat once after mount
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-30))); } catch { /* storage blocked: chat lasts for this page only */ } }, [turns]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  // a one-time hello a few seconds into the visit, unless the chat is already in use
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(GREETED) === "1" || load().length > 0; } catch { /* storage blocked: still greet once on this page */ }
    if (seen) return;
    const show = setTimeout(() => setGreeting(true), GREET_AFTER_MS);
    const hide = setTimeout(() => setGreeting(false), GREET_AFTER_MS + GREET_FOR_MS);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);
  const dismissGreeting = () => {
    setGreeting(false);
    try { sessionStorage.setItem(GREETED, "1"); } catch { /* fine */ }
  };
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [turns, busy, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(message: string) {
    const q = message.trim().slice(0, 1000);
    if (!q || busy) return;
    const next: Turn[] = [...turns.filter((t) => !t.error), { role: "user", content: q }];
    setTurns(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setTurns([...next, { role: "assistant", content: data.error ?? "Something went wrong. Please try again.", error: true }]);
      else setTurns([...next, { role: "assistant", content: data.reply, listings: data.listings }]);
    } catch {
      setTurns([...next, { role: "assistant", content: "Could not reach the assistant. Check your connection and try again.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => { dismissGreeting(); setOpen((o) => !o); }}
        aria-expanded={open}
        aria-controls="assistant-panel"
        aria-label={open ? "Close Ask Sawari" : "Ask Sawari"}
        title={open ? undefined : "Ask Bike Dai"}
        className={`chat-head fixed bottom-[calc(var(--compare-bar,0px)+var(--cookie-notice,0px)+1rem)] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-ink text-canvas shadow-pop ring-4 ring-canvas transition-transform duration-150 hover:scale-105 active:scale-95 sm:right-5 ${open ? "max-sm:hidden" : ""}`}
      >
        <Icon name={open ? "close" : "bike"} className="size-7" />
        {greeting && !open && <span aria-hidden className="absolute -right-0.5 -top-0.5 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-accent ring-2 ring-canvas">1</span>}
      </button>

      {greeting && !open && (
        // a message notification sliding out of the chat head, the way chat apps preview a new message
        <div
          role="status"
          className="greeting-pop fixed bottom-[calc(var(--compare-bar,0px)+var(--cookie-notice,0px)+1rem)] right-[5.25rem] z-40 flex h-14 items-center sm:right-[5.5rem]"
        >
          <div className="relative flex max-w-[min(18rem,calc(100vw-6.5rem))] items-center rounded-2xl bg-surface py-2 pl-3.5 pr-9 shadow-pop">
            {/* tail pointing right, at the chat head */}
            <span aria-hidden className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 bg-surface" />
            <button type="button" onClick={() => { dismissGreeting(); setOpen(true); }} lang="ne" className="relative block text-left">
              <span className="block text-xs font-medium text-muted">
                <span className="font-deva">बाइक दाइ</span> · AI <span className="font-deva">सहायक</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block font-deva text-[15px] leading-snug text-ink">नमस्ते! म बाइक दाइ, तपाईंको AI सहायक। कस्तो बाइक खोज्दै हुनुहुन्छ?</span>
              <span lang="en" className="sr-only">Hello! I am Bike Dai, your AI assistant. What kind of bike are you looking for?</span>
            </button>
            <button type="button" onClick={dismissGreeting} aria-label="Dismiss greeting" className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink">
              <Icon name="close" className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <section
          id="assistant-panel"
          role="dialog"
          aria-label="Sawari assistant"
          className="fixed inset-0 z-50 flex flex-col bg-canvas sm:inset-auto sm:bottom-[calc(var(--compare-bar,0px)+var(--cookie-notice,0px)+4.5rem)] sm:right-5 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:shadow-pop"
        >
          <header className="flex items-center justify-between gap-3 bg-surface px-4 py-3 sm:rounded-t-2xl">
            <div>
              <h2 className="text-[24px] leading-none">Ask Sawari</h2>
              <p className="mt-1 text-xs text-muted">Finds bikes for sale and explains how the site works.</p>
            </div>
            <button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Close assistant" className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-cream">
              <Icon name="close" className="size-5" />
            </button>
          </header>

          <div role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <div className="space-y-3">
                <p className="text-ink">Tell me what bike you are looking for, or ask how buying and selling works here.</p>
                <ul className="flex flex-col items-start gap-2">
                  {STARTERS.map((s) => (
                    <li key={s}><button type="button" onClick={() => send(s)} className="rounded-full bg-surface px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-cream">{s}</button></li>
                  ))}
                </ul>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={t.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3.5 py-2.5 text-[15px] ${t.role === "user" ? "bg-dark text-on-dark" : t.error ? "bg-error/10 text-error" : "bg-surface text-ink"}`}>
                  {t.content}
                </div>
                {t.listings && t.listings.length > 0 && (
                  <ul aria-label="Matching bikes" className="mt-2 space-y-2">
                    {t.listings.map((l) => (
                      <li key={l.id}>
                        <Link href={`/listings/${l.id}`} className="flex gap-3 rounded-xl bg-surface p-2 transition-colors hover:bg-cream">
                          <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                            {l.image && <SafeImage src={l.image} alt="" fill sizes="80px" className="object-cover" />}
                          </span>
                          <span className="min-w-0 text-sm">
                            <span className="block truncate font-medium text-ink">{l.title}</span>
                            <span className="block font-display text-base tabular-nums lining-nums text-ink">{formatNpr(l.priceNpr)}</span>
                            <span className="block truncate text-xs text-muted">{l.city}, {formatKm(l.kmDriven)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && <p className="text-sm text-muted" role="status">Looking…</p>}
            <div ref={end} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="bg-surface p-3 sm:rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
                rows={1}
                maxLength={1000}
                aria-label="Your message"
                placeholder="Ask about a bike…"
                className="input max-h-32 resize-none !bg-canvas"
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="btn-primary !px-3">
                <Icon name="send" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              Answers can be wrong; check the ad itself. Messages are sent to OpenRouter to answer them. <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
            </p>
          </form>
        </section>
      )}
    </>
  );
}
