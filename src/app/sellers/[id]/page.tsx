import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ListingCard } from "@/components/ListingCard";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/Stars";
import { deleteReview } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { BUSINESS } from "@/lib/business";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { cardSelect } from "@/lib/queries";
import { reviewEligibility } from "@/lib/reviews";

export async function generateMetadata({ params }: PageProps<"/sellers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const seller = await db.user.findUnique({ where: { id }, select: { name: true, email: true, banned: true } });
  if (!seller || seller.banned) return { title: "Seller profile", robots: { index: false } };
  const name = seller.name ?? seller.email.split("@")[0];
  return {
    title: `${name}: bikes for sale and seller reviews`,
    description: `Used motorcycles and scooters for sale by ${name} on ${BUSINESS.siteName}, with reviews from buyers who dealt with them.`,
    alternates: { canonical: `/sellers/${id}` },
  };
}

export default async function SellerPage({ params }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  const [user, seller] = await Promise.all([
    getUser(),
    db.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, createdAt: true, banned: true,
        listings: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 12, select: cardSelect },
      },
    }),
  ]);
  if (!seller || seller.banned) notFound();

  const [reviews, agg, mine, eligibility] = await Promise.all([
    db.review.findMany({ where: { sellerId: id }, orderBy: { createdAt: "desc" }, take: 30, include: { reviewer: { select: { name: true, email: true } } } }),
    db.review.aggregate({ where: { sellerId: id }, _avg: { rating: true }, _count: { _all: true } }),
    user ? db.review.findUnique({ where: { reviewerId_sellerId: { reviewerId: user.id, sellerId: id } } }) : null,
    user ? reviewEligibility(user.id, id) : null,
  ]);
  const name = seller.name ?? seller.email.split("@")[0];
  const avg = agg._avg.rating;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-[26px] sm:text-[32px]">{name}</h1>
      <p className="mt-1 text-sm text-muted">Member since {seller.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
      <div className="mt-3">
        {avg ? <Stars avg={avg} count={agg._count._all} className="text-lg" /> : <span className="text-muted">No reviews yet</span>}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="reviews">
          <h2 id="reviews" className="text-2xl">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 rounded-lg bg-surface p-8 text-center text-muted">Nobody has reviewed this seller yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-lg bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <Stars avg={r.rating} />
                    <span className="text-sm font-medium">{r.reviewer.name ?? r.reviewer.email.split("@")[0]}</span>
                    <span className="text-sm text-muted">{timeAgo(r.createdAt)}</span>
                    {(user?.id === r.reviewerId || user?.role === "ADMIN") && (
                      <form action={deleteReview} className="ml-auto">
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmButton message="Delete this review?" className="text-sm text-muted hover:text-brand">Delete</ConfirmButton>
                      </form>
                    )}
                  </div>
                  {r.comment && <p className="mt-2 whitespace-pre-line leading-relaxed">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rounded-lg bg-surface p-6 lg:self-start">
          <h2 className="text-xl">{mine ? "Your review" : "Rate this seller"}</h2>
          <div className="mt-3">
            {!user ? (
              <Link href={`/login?next=/sellers/${id}`} className="btn-outline w-full">Log in to leave a review</Link>
            ) : eligibility === "self" ? (
              <p className="text-sm text-muted">This is your own profile.</p>
            ) : eligibility === "no_contact" ? (
              <p className="text-sm text-muted">Message this seller about a bike first. Then you can rate how it went.</p>
            ) : (
              <ReviewForm sellerId={id} initial={mine ? { rating: mine.rating, comment: mine.comment } : undefined} />
            )}
          </div>
        </aside>
      </div>

      {seller.listings.length > 0 && (
        <section className="mt-14" aria-labelledby="ads">
          <h2 id="ads" className="text-2xl">Bikes for sale</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {seller.listings.map((l) => <ListingCard key={l.id} listing={l} compare />)}
          </div>
        </section>
      )}
    </div>
  );
}
