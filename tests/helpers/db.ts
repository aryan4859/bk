import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const uid = () => randomBytes(5).toString("hex");

export async function resetDb() {
  await db.$executeRawUnsafe(
    'TRUNCATE "SearchMatch","SavedSearch","Review","Favorite","Report","Message","Thread","Image","Listing","Otp","RateLimit","User" RESTART IDENTITY CASCADE',
  );
}

export const makeUser = (o: Partial<Prisma.UserUncheckedCreateInput> = {}) =>
  db.user.create({ data: { email: `u-${uid()}@test.local`, ...o } });

export const makeListing = (sellerId: string, o: Partial<Prisma.ListingUncheckedCreateInput> = {}) =>
  db.listing.create({
    data: {
      sellerId, title: "Honda Shine 2020", description: "Well maintained, single owner, all papers clear.",
      type: "MOTORCYCLE", brand: "Honda", model: "Shine", year: 2020, kmDriven: 10000, priceNpr: 200000,
      city: "Pokhara", phone: "9779841234567", status: "ACTIVE", ...o,
    },
  });

/** A buyer who has opened a chat and sent one message to the seller about a listing. */
export async function makeConversation(buyerId: string, listingId: string) {
  const thread = await db.thread.create({ data: { buyerId, listingId } });
  await db.message.create({ data: { threadId: thread.id, senderId: buyerId, body: "Is this still available?" } });
  return thread;
}

export const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);
