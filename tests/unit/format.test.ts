import { describe, expect, it, vi } from "vitest";
import { daysAgo, formatKm, formatNpr, isFeaturedNow, normalizePhone, timeAgo } from "@/lib/format";

describe("format", () => {
  it("formats prices with Indian digit grouping", () => {
    expect(formatNpr(1234567)).toBe("Rs. 12,34,567");
    expect(formatNpr(5000)).toBe("Rs. 5,000");
  });
  it("formats kilometres", () => {
    expect(formatKm(12500)).toBe("12,500 km");
    expect(formatKm(0)).toBe("0 km");
  });
  it("normalizes Nepali phone numbers", () => {
    expect(normalizePhone("9841234567")).toBe("9779841234567");
    expect(normalizePhone("+977 984-123-4567")).toBe("9779841234567");
    expect(normalizePhone("98412")).toBe("98412");
  });
  it("describes elapsed time", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-01T12:00:00Z"));
    expect(timeAgo(new Date("2026-06-01T11:59:50Z"))).toBe("just now");
    expect(timeAgo(new Date("2026-06-01T11:00:00Z"))).toBe("1 hour ago");
    expect(timeAgo(new Date("2026-05-29T12:00:00Z"))).toBe("3 days ago");
    expect(daysAgo(2).getTime()).toBe(new Date("2026-05-30T12:00:00Z").getTime());
    vi.useRealTimers();
  });
  it("knows whether a boost is still running", () => {
    expect(isFeaturedNow(null)).toBe(false);
    expect(isFeaturedNow(undefined)).toBe(false);
    expect(isFeaturedNow(new Date(Date.now() - 1000))).toBe(false);
    expect(isFeaturedNow(new Date(Date.now() + 60_000))).toBe(true);
  });
});
