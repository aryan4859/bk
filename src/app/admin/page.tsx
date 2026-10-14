import Link from "next/link";
import { ReviewActions } from "@/components/ReviewActions";
import { Photo } from "@/components/Photo";
import { db } from "@/lib/db";
import { daysAgo, formatNpr, timeAgo } from "@/lib/format";

export default async function Dashboard() {
  const week = daysAgo(7);
  const [users, newUsers, live, pending, sold, reports, threads, newListings, queue, signups] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: week } } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { status: "PENDING" } }),
    db.listing.count({ where: { status: "SOLD" } }),
    db.report.count({ where: { resolved: false } }),
    db.thread.count(),
    db.listing.count({ where: { createdAt: { gte: week } } }),
    db.listing.findMany({
      where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, seller: { select: { email: true } } },
    }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats: [string, number, string?][] = [
    ["Users", users, `+${newUsers} this week`],
    ["Live ads", live, `+${newListings} posted this week`],
    ["Awaiting review", pending],
    ["Sold", sold],
    ["Open reports", reports],
    ["Conversations", threads],
  ];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, n, sub]) => (
          <div key={label} className="rounded-lg border border-line bg-card p-4">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-3xl font-bold">{n}</div>
            {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Oldest waiting for review</h2>
          <Link href="/admin/listings?status=PENDING" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        {queue.length === 0 ? (
          <p className="mt-3 text-muted">All caught up.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card">
            {queue.map((l) => (
              <li key={l.id} className="flex gap-4 p-4">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-wash"><Photo src={l.images[0]?.url} alt="" /></div>
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.id}`} className="font-medium hover:underline">{l.title}</Link>
                  <div className="text-sm text-muted">{formatNpr(l.priceNpr)} · {l.seller.email} · {timeAgo(l.createdAt)}</div>
                  <div className="mt-2"><ReviewActions id={l.id} status={l.status} /></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">New users</h2>
          <Link href="/admin/users" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card text-[15px]">
          {signups.map((u) => (
            <li key={u.id} className="flex justify-between p-3">
              <span>{u.email}</span><span className="text-muted">{timeAgo(u.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
