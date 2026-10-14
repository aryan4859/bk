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
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-6 md:self-start">
        <div className="mb-3 hidden text-xs font-medium uppercase tracking-wide text-muted md:block">Admin</div>
        <AdminNav pending={pending} reports={reports} />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
