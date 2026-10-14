"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "@/lib/actions";

type Msg = { id: string; body: string; mine: boolean; time: string };

export function Chat({ threadId, messages }: { threadId: string; messages: Msg[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendMessage.bind(null, threadId), undefined);
  const form = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);

  // simple polling keeps the conversation fresh without websockets
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, 5000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface">
      <div className="h-[55vh] space-y-2 overflow-y-auto p-4" role="log" aria-label="Conversation" tabIndex={0}>
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Say hello and ask about the bike.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-[15px] ${m.mine ? "bg-accent text-ink" : "bg-surface-sunk"}`}>
              {m.body}
              <div className={`mt-0.5 text-xs ${m.mine ? "text-white" : "text-muted"}`}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        ref={form}
        action={async (fd) => { await action(fd); form.current?.reset(); }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input name="body" required maxLength={1000} autoComplete="off" aria-label="Your message" placeholder="Write a message…" className="input" />
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Sending…" : "Send message"}</button>
      </form>
      {state?.error && <p role="alert" className="px-3 pb-3 text-sm text-brand">{state.error}</p>}
    </div>
  );
}
