import { SYSTEM_PROMPT } from "./prompt";
import { type ListingCard, SEARCH_TOOL, runSearch } from "./tools";

export type ChatTurn = { role: "user" | "assistant"; content: string };
type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type ApiMessage = { role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string; [k: string]: unknown };

export const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
const MAX_TOOL_ROUNDS = 4;

export class AssistantError extends Error {
  constructor(message: string, readonly status = 502) { super(message); }
}

export const assistantConfigured = () => !!process.env.OPENROUTER_API_KEY?.trim();

/**
 * One visitor turn: calls the model through OpenRouter, runs any search_listings calls against our own
 * database, and loops until the model answers. Returns the reply and the bikes from the last search.
 */
export async function chat(history: ChatTurn[]): Promise<{ reply: string; listings: ListingCard[] }> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new AssistantError("The assistant is not set up.", 503);
  const base = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const messages: ApiMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  let listings: ListingCard[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "http-referer": process.env.SITE_URL ?? "http://localhost:3000",
        "x-title": "Seto Durbar",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
        messages,
        tools: [SEARCH_TOOL],
        tool_choice: round < MAX_TOOL_ROUNDS ? "auto" : "none", // last round must answer
        max_tokens: 2000,
        // a chat helper does not need deep thinking; keep it quick and cheap, and don't send it back to visitors
        reasoning: { effort: "low", exclude: true },
      }),
      signal: AbortSignal.timeout(25_000),
    }).catch((e: Error) => { throw new AssistantError(e.name === "TimeoutError" ? "The assistant took too long. Please try again." : "Could not reach the assistant."); });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("openrouter error", res.status, detail.slice(0, 300));
      throw new AssistantError(res.status === 429 ? "The assistant is busy. Please try again in a minute." : "The assistant is unavailable right now.");
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    const msg: ApiMessage | undefined = choice?.message;
    if (!msg) throw new AssistantError("The assistant returned nothing. Please try again.");

    const calls = msg.tool_calls ?? [];
    if (!calls.length) return { reply: (msg.content ?? "").trim() || "Sorry, I could not answer that.", listings };

    // keep the assistant message as received (including reasoning details) and answer every call in it
    messages.push(msg);
    for (const call of calls) {
      let content: string;
      if (call.function?.name !== "search_listings") {
        content = JSON.stringify({ error: `Unknown tool ${call.function?.name}` });
      } else {
        try {
          const { forModel, cards } = await runSearch(JSON.parse(call.function.arguments || "{}"));
          listings = cards;
          content = JSON.stringify(forModel);
        } catch {
          content = JSON.stringify({ error: "The search arguments could not be read." });
        }
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  throw new AssistantError("The assistant could not finish. Please try a simpler question.");
}
