import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const [pending, reports] = await Promise.all([
    db.listing.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { resolved: false } }),
  ]);
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:py-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
      <aside className="-mx-4 min-w-0 px-4 md:sticky md:top-6 md:mx-0 md:self-start md:px-0">
        <div className="mb-3 hidden text-xs font-medium uppercase tracking-wide text-muted md:block">Admin</div>
        <AdminNav pending={pending} reports={reports} />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
