import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chat } from "@/components/Chat";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNpr } from "@/lib/format";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function Thread({ params }: PageProps<"/inbox/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/inbox/${id}`);
  const t = await db.thread.findUnique({
    where: { id },
    include: {
      listing: { include: { seller: { select: { name: true, email: true } } } },
      buyer: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 300 },
    },
  });
  if (!t || (t.buyerId !== user.id && t.listing.sellerId !== user.id)) notFound();

  // opening (or polling) the conversation marks it read for this side
  const isSeller = t.listing.sellerId === user.id;
  await db.thread.update({ where: { id }, data: isSeller ? { sellerReadAt: new Date() } : { buyerReadAt: new Date() } });

  const other = t.listing.sellerId === user.id ? t.buyer : t.listing.seller;
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/inbox" className="text-sm text-muted hover:text-ink">← All messages</Link>
      <div className="mb-4 mt-2">
        <h1 className="text-xl">{other.name ?? other.email.split("@")[0]}</h1>
        <Link href={`/listings/${t.listingId}`} className="text-sm link">
          {t.listing.title}, {formatNpr(t.listing.priceNpr)}
        </Link>
      </div>
      <Chat threadId={t.id} messages={t.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, time: fmt.format(m.createdAt) }))} />
    </div>
  );
}
