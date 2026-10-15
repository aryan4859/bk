// Stand-in for OpenRouter during browser tests: scripted, free, offline.
import { createServer } from "node:http";

const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const say = (text) => ({ choices: [{ finish_reason: "stop", message: { role: "assistant", content: text } }] });

createServer((req, res) => {
  if (req.method === "GET") return json(res, 200, { ok: true });
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    const msgs = body.messages ?? [];
    const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content ?? "";
    const toolResult = msgs.findLast?.((m) => m.role === "tool");
    if (/fail/i.test(lastUser)) return json(res, 500, { error: "upstream exploded" });
    if (toolResult) {
      const { total, bikes } = JSON.parse(toolResult.content);
      return json(res, 200, say(total ? `I found ${total}: ${bikes.map((b) => `${b.year} ${b.brand} ${b.model} for ${b.price}`).join("; ")}.` : "Nothing matches right now."));
    }
    if (/sell/i.test(lastUser)) return json(res, 200, say("Click \"Sell a bike\" in the header. Posting is free and the team checks each ad first."));
    const brand = ["Honda", "Bajaj", "KTM", "Yamaha"].find((b) => lastUser.toLowerCase().includes(b.toLowerCase()));
    return json(res, 200, { choices: [{ finish_reason: "tool_calls", message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "search_listings", arguments: JSON.stringify(brand ? { brand } : {}) } }] } }] });
  });
}).listen(3199, () => console.log("mock openrouter on 3199"));
