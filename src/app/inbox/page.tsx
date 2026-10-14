import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNpr, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

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
    <>
    <PageHero title="Messages" subtitle="Your conversations with buyers and sellers." />
    <div className="mx-auto max-w-3xl px-6 py-10">
      {threads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-10 text-center text-muted">No conversations yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface ">
          {threads.map((t) => {
            const last = t.messages[0];
            const readAt = t.listing.sellerId === user.id ? t.sellerReadAt : t.buyerReadAt;
            const unread = !!last && last.senderId !== user.id && last.createdAt > readAt;
            const buyerName = t.buyer.name ?? t.buyer.email.split("@")[0];
            return (
              <li key={t.id}>
                <Link href={`/inbox/${t.id}`} className="block p-4 hover:bg-surface-sunk">
                  <div className="flex justify-between gap-4">
                    <span className="truncate font-medium">{unread && <span className="mr-2 inline-block size-2 rounded-full bg-accent align-middle" />}{t.listing.title}</span>
                    <span className="shrink-0 text-sm text-muted">{last && timeAgo(last.createdAt)}</span>
                  </div>
                  <div className="text-sm text-muted">
                    {formatNpr(t.listing.priceNpr)}, {t.listing.sellerId === user.id ? `Buyer: ${buyerName}` : "You are the buyer"}
                  </div>
                  <div className={`mt-1 truncate text-[15px] ${unread ? "font-semibold" : ""}`}>{last ? `${last.senderId === user.id ? "You: " : ""}${last.body}` : "No messages yet"}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </>
  );
}
