import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteListing, resolveReport, setBanned } from "@/lib/actions";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const resolved = (await searchParams).show === "resolved";
  const reports = await db.report.findMany({
    where: { resolved }, orderBy: { createdAt: resolved ? "desc" : "asc" }, take: 100,
    include: {
      listing: { select: { id: true, title: true, seller: { select: { id: true, email: true, banned: true, role: true } } } },
      reporter: { select: { email: true } },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Reports</h1>
      <div className="mt-5 flex gap-2 text-sm">
        <Link href="/admin/reports" className={`rounded-full border px-3 py-1 ${!resolved ? "border-ink bg-ink text-white" : "border-line bg-card"}`}>Open</Link>
        <Link href="/admin/reports?show=resolved" className={`rounded-full border px-3 py-1 ${resolved ? "border-ink bg-ink text-white" : "border-line bg-card"}`}>Resolved</Link>
      </div>

      {reports.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">{resolved ? "Nothing resolved yet." : "No open reports."}</p>
      ) : (
        <ul className="mt-5 divide-y divide-line rounded-lg border border-line bg-card">
          {reports.map((r) => (
            <li key={r.id} className="p-4">
              <Link href={`/listings/${r.listing.id}`} className="font-medium hover:underline">{r.listing.title}</Link>
              <p className="mt-1">{r.reason}</p>
              <p className="text-sm text-muted">By {r.reporter.email} · {timeAgo(r.createdAt)} · seller {r.listing.seller.email}</p>
              {!resolved && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <form action={resolveReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-outline py-1 text-sm">Dismiss</button>
                  </form>
                  <form action={deleteListing}>
                    <input type="hidden" name="id" value={r.listing.id} />
                    <ConfirmButton message="Delete this ad permanently?" className="btn-outline py-1 text-sm text-brand">Delete ad</ConfirmButton>
                  </form>
                  {!r.listing.seller.banned && r.listing.seller.role !== "ADMIN" && (
                    <form action={setBanned}>
                      <input type="hidden" name="id" value={r.listing.seller.id} />
                      <input type="hidden" name="ban" value="1" />
                      <ConfirmButton message="Suspend this seller and take down their ads?" className="text-sm text-muted hover:text-brand">Suspend seller</ConfirmButton>
                    </form>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
