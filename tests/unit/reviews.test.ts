import { describe, expect, it } from "vitest";
import { formatRating, reviewSchema } from "@/lib/reviews";

describe("reviewSchema", () => {
  it.each([1, 3, 5, "4"])("accepts rating %s", (rating) => {
    expect(reviewSchema.safeParse({ rating, comment: "" }).success).toBe(true);
  });
  it.each([0, 6, -1, 2.5, "abc", "", null, undefined])("rejects rating %s", (rating) => {
    expect(reviewSchema.safeParse({ rating, comment: "" }).success).toBe(false);
  });
  it("turns an empty comment into null and trims text", () => {
    expect(reviewSchema.parse({ rating: 5, comment: "   " }).comment).toBeNull();
    expect(reviewSchema.parse({ rating: 5, comment: "  great  " }).comment).toBe("great");
  });
  it("rejects comments over 500 characters", () => {
    expect(reviewSchema.safeParse({ rating: 5, comment: "x".repeat(501) }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 5, comment: "x".repeat(500) }).success).toBe(true);
  });
});

describe("rating display", () => {
  it("shows one decimal", () => {
    expect(formatRating(4.25)).toBe("4.3");
    expect(formatRating(5)).toBe("5.0");
  });
});
