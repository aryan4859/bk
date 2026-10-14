import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNpr, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function Inbox() {
  const user = await requireUser("/inbox");
  const threads = await db.thread.findMany({
    where: { OR: [{ buyerId: user.id }, { listing: { sellerId: user.id } }] },
    include: {
      listing: { select: { title: true, priceNpr: true, sellerId: true } },
      buyer: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  threads.sort((a, b) => (b.messages[0]?.createdAt ?? b.createdAt).getTime() - (a.messages[0]?.createdAt ?? a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Messages</h1>
      {threads.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">No conversations yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-card">
          {threads.map((t) => {
            const last = t.messages[0];
            const buyerName = t.buyer.name ?? t.buyer.email.split("@")[0];
            return (
              <li key={t.id}>
                <Link href={`/inbox/${t.id}`} className="block p-4 hover:bg-wash">
                  <div className="flex justify-between gap-4">
                    <span className="truncate font-medium">{t.listing.title}</span>
                    <span className="shrink-0 text-sm text-muted">{last && timeAgo(last.createdAt)}</span>
                  </div>
                  <div className="text-sm text-muted">
                    {formatNpr(t.listing.priceNpr)} · {t.listing.sellerId === user.id ? `Buyer: ${buyerName}` : "You are the buyer"}
                  </div>
                  <div className="mt-1 truncate text-[15px]">{last ? `${last.senderId === user.id ? "You: " : ""}${last.body}` : "No messages yet"}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
