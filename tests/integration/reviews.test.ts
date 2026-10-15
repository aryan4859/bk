import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { reviewEligibility } from "@/lib/reviews";
import { makeConversation, makeListing, makeUser, resetDb } from "../helpers/db";

beforeEach(resetDb);

describe("reviewEligibility", () => {
  it("blocks reviewing yourself", async () => {
    const u = await makeUser();
    expect(await reviewEligibility(u.id, u.id)).toBe("self");
  });
  it("requires that the buyer wrote to the seller", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    const l = await makeListing(seller.id);
    expect(await reviewEligibility(buyer.id, seller.id)).toBe("no_contact");
    // opening a thread without sending anything is not enough
    const thread = await db.thread.create({ data: { buyerId: buyer.id, listingId: l.id } });
    expect(await reviewEligibility(buyer.id, seller.id)).toBe("no_contact");
    await db.message.create({ data: { threadId: thread.id, senderId: buyer.id, body: "hi" } });
    expect(await reviewEligibility(buyer.id, seller.id)).toBe("ok");
  });
  it("does not count messages the seller sent, or chats with other sellers", async () => {
    const [seller, other, buyer] = [await makeUser(), await makeUser(), await makeUser()];
    const l = await makeListing(seller.id);
    const thread = await db.thread.create({ data: { buyerId: buyer.id, listingId: l.id } });
    await db.message.create({ data: { threadId: thread.id, senderId: seller.id, body: "hello" } });
    expect(await reviewEligibility(buyer.id, seller.id)).toBe("no_contact");
    await makeConversation(buyer.id, (await makeListing(other.id)).id);
    expect(await reviewEligibility(buyer.id, seller.id)).toBe("no_contact");
    expect(await reviewEligibility(buyer.id, other.id)).toBe("ok");
  });
});
