import { z } from "zod";
import { AssistantError, chat } from "@/lib/assistant/chat";
import { getUser } from "@/lib/auth";
import { MINUTE, clientIp, rateLimit } from "@/lib/ratelimit";

const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1000) })).min(1).max(20),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") return Response.json({ error: "Invalid message." }, { status: 400 });

  // per visitor (and per account when logged in), plus a site-wide daily cap that bounds the bill
  const user = await getUser();
  const who = user ? `user:${user.id}` : `ip:${await clientIp()}`;
  if (!(await rateLimit(`assistant:${who}`, 20, 10 * MINUTE))) return Response.json({ error: "You are sending messages too fast. Please wait a few minutes." }, { status: 429 });
  if (!(await rateLimit("assistant:all", 2000, 24 * 60 * MINUTE))) return Response.json({ error: "The assistant is resting for today. Please use Browse instead." }, { status: 429 });

  try {
    // only the last 10 turns are sent; older ones add cost without helping
    return Response.json(await chat(parsed.data.messages.slice(-10)));
  } catch (e) {
    const err = e instanceof AssistantError ? e : new AssistantError("Something went wrong. Please try again.");
    if (!(e instanceof AssistantError)) console.error("assistant failed", e);
    return Response.json({ error: err.message }, { status: err.status });
  }
}
