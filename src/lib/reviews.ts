import { z } from "zod";
import { db } from "./db";

export const reviewSchema = z.object({
  rating: z.coerce.number("Pick a star rating").int("Pick a star rating").min(1, "Pick a star rating").max(5, "Pick a star rating"),
  comment: z.string().trim().max(500, "Keep the comment under 500 characters").transform((v) => v || null),
});

export type ReviewEligibility = "ok" | "self" | "no_contact";

/** Only buyers who actually wrote to the seller can review them, and never their own account. */
export async function reviewEligibility(reviewerId: string, sellerId: string): Promise<ReviewEligibility> {
  if (reviewerId === sellerId) return "self";
  const talked = await db.message.findFirst({
    where: { senderId: reviewerId, thread: { buyerId: reviewerId, listing: { sellerId } } },
    select: { id: true },
  });
  return talked ? "ok" : "no_contact";
}

export const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
export const formatRating = (avg: number) => (Math.round(avg * 10) / 10).toFixed(1);
