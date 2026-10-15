import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { setBanned, setRole } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE = 25;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE,
      include: { _count: { select: { listings: true, reports: true } } },
    }),
    db.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `/admin/users?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Users <span className="text-lg font-normal text-muted">{total}</span></h1>
        <form className="flex w-full gap-2 sm:w-auto">
          <input name="q" defaultValue={q} placeholder="Email or name" className="input min-w-0 flex-1 py-1.5 sm:w-60 sm:flex-none" />
          <button className="btn-outline py-1.5">Search</button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl bg-surface">
        <table className="w-full text-left text-base">
          <thead className="bg-cream text-sm text-muted">
            <tr>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Ads</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-wash">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="font-medium">{u.email}</div>
                  {u.name && <div className="text-sm text-muted">{u.name}</div>}
                </td>
                <td className="p-3">{u._count.listings}</td>
                <td className="whitespace-nowrap p-3 text-muted">{u.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="p-3">
                  {u.banned ? <span className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand">Suspended</span>
                    : u.role === "ADMIN" ? <span className="rounded-full bg-dark px-2.5 py-0.5 text-xs font-medium text-on-dark">Admin</span>
                    : <span className="text-muted">Active</span>}
                </td>
                <td className="p-3">
                  {u.id !== me.id && (
                    <div className="flex justify-end gap-3 text-sm">
                      {u.role !== "ADMIN" && (
                        <form action={setBanned}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="ban" value={u.banned ? "0" : "1"} />
                          {u.banned
                            ? <button className="link">Restore</button>
                            : <ConfirmButton message={`Suspend ${u.email}? Their live ads will be taken down.`} className="text-muted hover:text-error">Suspend</ConfirmButton>}
                        </form>
                      )}
                      {!u.banned && (
                        <form action={setRole}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="role" value={u.role === "ADMIN" ? "USER" : "ADMIN"} />
                          <ConfirmButton message={u.role === "ADMIN" ? `Remove admin rights from ${u.email}?` : `Make ${u.email} an admin?`} className="text-muted hover:text-ink">
                            {u.role === "ADMIN" ? "Remove admin" : "Make admin"}
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="btn-outline">Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="btn-outline">Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
