import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "../helpers/env";

/** Deterministic data for the browser tests. Runs against the test database only. */
export default async function globalSetup() {
  const url = testDatabaseUrl();
  if (!/motovo_test/.test(url)) throw new Error("Refusing to seed a database that is not the test database");
  const db = new PrismaClient({ datasources: { db: { url } } });
  await db.$executeRawUnsafe(
    'TRUNCATE "SearchMatch","SavedSearch","Review","Favorite","Report","Message","Thread","Image","Listing","Otp","RateLimit","User" RESTART IDENTITY CASCADE',
  );
  const photo = "/uploads/" + (readdirSync("uploads").find((f) => /^[a-f0-9]{24}\.(jpg|png|webp)$/.test(f)) ?? "missing.jpg");

  const admin = await db.user.create({ data: { email: "admin@e2e.test", name: "Ada Admin", role: "ADMIN" } });
  const seller = await db.user.create({ data: { email: "seller@e2e.test", name: "Sam Seller" } });
  const buyer = await db.user.create({ data: { email: "buyer@e2e.test", name: "Bea Buyer" } });
  const stranger = await db.user.create({ data: { email: "stranger@e2e.test", name: "Stu Stranger" } });

  const base = { description: "Well maintained bike, single owner, all papers are clear.", phone: "9779841234567", status: "ACTIVE" as const };
  const mk = (o: { title: string; brand: string; model: string; type?: "MOTORCYCLE" | "SCOOTER"; year: number; kmDriven: number; priceNpr: number; city: string; sellerId?: string; featuredUntil?: Date; status?: "ACTIVE" | "PENDING"; ownerCount?: number; bluebookOk?: boolean; createdAt?: Date }) =>
    db.listing.create({ data: { ...base, type: "MOTORCYCLE", ownerCount: 1, sellerId: seller.id, ...o, images: { create: [{ url: photo, position: 0 }] } } });

  const cities = ["Kathmandu", "Pokhara", "Lalitpur", "Butwal"];
  const filler = [];
  for (let i = 0; i < 14; i++) {
    filler.push(await mk({
      title: `Yamaha FZ filler ${i}`, brand: "Yamaha", model: "FZ", year: 2015 + (i % 8), kmDriven: 5000 + i * 1000,
      priceNpr: 200000 + i * 5000, city: cities[i % 4], createdAt: new Date(Date.now() - i * 3600_000),
    }));
  }
  const pulsar = await mk({ title: "Bajaj Pulsar NS200 red", brand: "Bajaj", model: "Pulsar NS200", year: 2019, kmDriven: 12000, priceNpr: 310000, city: "Kathmandu", bluebookOk: true });
  const dio = await mk({ title: "Honda Dio scooter", brand: "Honda", model: "Dio", type: "SCOOTER", year: 2021, kmDriven: 4000, priceNpr: 215000, city: "Pokhara", ownerCount: 2 });
  const featured = await mk({ title: "KTM Duke 250 featured", brand: "KTM", model: "Duke 250", year: 2022, kmDriven: 3000, priceNpr: 520000, city: "Kathmandu", featuredUntil: new Date(Date.now() + 7 * 86_400_000), createdAt: new Date("2025-01-01") });
  const pending = await mk({ title: "Hero Splendor awaiting approval", brand: "Hero", model: "Splendor", year: 2016, kmDriven: 40000, priceNpr: 90000, city: "Butwal", status: "PENDING" });
  const pendingHidden = await mk({ title: "Suzuki Gixxer never approved", brand: "Suzuki", model: "Gixxer", year: 2018, kmDriven: 22000, priceNpr: 260000, city: "Lalitpur", status: "PENDING" });
  const adminOwn = await mk({ title: "Admin's Vespa", brand: "Vespa", model: "VXL 150", type: "SCOOTER", year: 2020, kmDriven: 8000, priceNpr: 380000, city: "Lalitpur", sellerId: admin.id });

  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/fixtures.json", JSON.stringify({
    users: { admin, seller, buyer, stranger },
    listings: { pulsar, dio, featured, pending, pendingHidden, adminOwn, filler: filler.map((l) => l.id) },
  }, null, 2));
  await db.$disconnect();
}
