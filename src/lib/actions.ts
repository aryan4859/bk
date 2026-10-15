"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "./auth";
import { flash } from "./flash";
import { BRANDS, CITIES, FEATURE_DAYS, MAX_IMAGES } from "./constants";
import { db } from "./db";
import { saveImage } from "./images";
import { normalizePhone } from "./format";
import { HOUR, MINUTE, rateLimit } from "./ratelimit";
import { notifyListingLive } from "./alerts";
import { describeFilters, filtersFromQuery, filtersToQuery } from "./queries";
import { reviewEligibility, reviewSchema } from "./reviews";

export type FormState =
  | { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

// echoed back on validation errors so the form keeps what the user typed
const valuesOf = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));

// ---------- session ----------

export async function logout() {
  (await cookies()).delete("session");
  await flash("You have been logged out.");
  redirect("/");
}

export async function updateName(formData: FormData) {
  const user = await requireUser("/my");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  await db.user.update({ where: { id: user.id }, data: { name: name || null } });
  await flash(name ? "Display name saved." : "Display name cleared.");
  revalidatePath("/", "layout");
}

// ---------- listings ----------

const listingSchema = z.object({
  type: z.enum(["MOTORCYCLE", "SCOOTER"]),
  brand: z.enum(BRANDS),
  model: z.string().trim().min(1, "Enter the model").max(60),
  year: z.coerce.number().int().min(1990, "Year looks too old").max(new Date().getFullYear() + 1, "Year is in the future"),
  kmDriven: z.coerce.number().int().min(0, "Enter kilometres driven").max(500000),
  ownerCount: z.coerce.number().int().min(1).max(10),
  priceNpr: z.coerce.number().int().min(1000, "Price must be at least Rs. 1,000").max(100_000_000),
  negotiable: z.boolean(),
  city: z.enum(CITIES),
  phone: z.string().transform(normalizePhone).refine((p) => /^977(98|97|96)\d{8}$/.test(p), "Enter a valid Nepali mobile number (98XXXXXXXX)"),
  bluebookOk: z.boolean(),
  confirm: z.literal(true, "Please confirm this before posting"),
  title: z.string().trim().min(5, "Add a short title (at least 5 characters)").max(100),
  description: z.string().trim().min(20, "Describe the condition in at least 20 characters").max(3000),
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}).transform(({ confirm, ...rest }) => rest);

function parseListing(formData: FormData) {
  return listingSchema.safeParse({
    type: formData.get("type"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    kmDriven: formData.get("kmDriven"),
    ownerCount: formData.get("ownerCount"),
    priceNpr: formData.get("priceNpr"),
    negotiable: formData.get("negotiable") === "on",
    city: formData.get("city"),
    phone: String(formData.get("phone") ?? ""),
    bluebookOk: formData.get("bluebookOk") === "on",
    confirm: formData.get("confirm") === "on",
    title: formData.get("title"),
    description: formData.get("description"),
  });
}

function fieldErrors(err: z.ZodError, fd: FormData): FormState {
  const fe: Record<string, string> = {};
  for (const i of err.issues) fe[String(i.path[0])] ??= i.message;
  return { error: "Please fix the highlighted fields.", fieldErrors: fe, values: valuesOf(fd) };
}

function newFiles(formData: FormData) {
  return formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
}

export async function createListing(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/sell");
  if (!(await rateLimit(`listing:create:${user.id}`, 5, HOUR))) return { error: "You are posting too fast. Try again in a while.", values: valuesOf(formData) };
  const parsed = parseListing(formData);
  if (!parsed.success) return fieldErrors(parsed.error, formData);
  const files = newFiles(formData);
  if (files.length === 0) return { error: "Add at least one photo.", values: valuesOf(formData) };
  if (files.length > MAX_IMAGES) return { error: `You can upload up to ${MAX_IMAGES} photos.`, values: valuesOf(formData) };

  let urls: string[];
  try {
    urls = await Promise.all(files.map(saveImage));
  } catch (e) {
    return { error: (e as Error).message, values: valuesOf(formData) };
  }

  const listing = await db.listing.create({
    data: {
      ...parsed.data,
      sellerId: user.id,
      images: { create: urls.map((url, position) => ({ url, position })) },
    },
  });
  redirect(`/listings/${listing.id}?posted=1`);
}

export async function updateListing(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(`/listings/${id}/edit`);
  const existing = await db.listing.findUnique({ where: { id }, include: { images: true } });
  if (!existing || existing.sellerId !== user.id) return { error: "Listing not found." };
  if (!(await rateLimit(`listing:edit:${user.id}`, 20, HOUR))) return { error: "Too many edits. Try again in a while.", values: valuesOf(formData) };

  const parsed = parseListing(formData);
  if (!parsed.success) return fieldErrors(parsed.error, formData);

  const remove = new Set(formData.getAll("removeImage").map(String));
  const keep = existing.images.filter((i) => !remove.has(i.id));
  const files = newFiles(formData);
  if (keep.length + files.length === 0) return { error: "A listing needs at least one photo.", values: valuesOf(formData) };
  if (keep.length + files.length > MAX_IMAGES) return { error: `You can have up to ${MAX_IMAGES} photos.`, values: valuesOf(formData) };

  let urls: string[];
  try {
    urls = await Promise.all(files.map(saveImage));
  } catch (e) {
    return { error: (e as Error).message, values: valuesOf(formData) };
  }

  await db.$transaction([
    db.image.deleteMany({ where: { listingId: id, id: { in: [...remove] } } }),
    db.image.createMany({ data: urls.map((url, i) => ({ listingId: id, url, position: keep.length + i })) }),
    db.listing.update({
      where: { id },
      // edits to a live ad go back through review so details can't be swapped after approval
      data: { ...parsed.data, status: existing.status === "SOLD" ? "SOLD" : "PENDING", rejectReason: null },
    }),
  ]);
  redirect(`/listings/${id}?edited=1`);
}

export async function setSold(formData: FormData) {
  const user = await requireUser("/my");
  const id = String(formData.get("id"));
  const sold = formData.get("sold") === "1";
  const l = await db.listing.findUnique({ where: { id } });
  if (!l || l.sellerId !== user.id || (l.status !== "ACTIVE" && l.status !== "SOLD")) return flash("We could not update that ad.", "error");
  await db.listing.update({ where: { id }, data: { status: sold ? "SOLD" : "ACTIVE" } });
  await flash(sold ? "Marked as sold." : "Marked as available.");
  revalidatePath("/my");
}

export async function deleteListing(formData: FormData) {
  const user = await requireUser("/my");
  const id = String(formData.get("id"));
  const l = await db.listing.findUnique({ where: { id } });
  if (!l || (l.sellerId !== user.id && user.role !== "ADMIN")) return flash("We could not delete that ad.", "error");
  // threads/reports reference the listing without cascade, so clear them first
  await db.$transaction([
    db.message.deleteMany({ where: { thread: { listingId: id } } }),
    db.thread.deleteMany({ where: { listingId: id } }),
    db.report.deleteMany({ where: { listingId: id } }),
    db.listing.delete({ where: { id } }),
  ]);
  await flash("Ad deleted.");
  revalidatePath("/my");
  revalidatePath("/admin", "layout");
  if (formData.get("redirect")) redirect(String(formData.get("redirect")));
}

export async function toggleFavorite(formData: FormData) {
  const listingId = String(formData.get("id"));
  const user = await requireUser(`/listings/${listingId}`);
  const key = { userId_listingId: { userId: user.id, listingId } };
  const has = await db.favorite.findUnique({ where: key });
  if (has) await db.favorite.delete({ where: key });
  else {
    const listing = await db.listing.findUnique({ where: { id: listingId }, select: { priceNpr: true } });
    if (!listing) return flash("That ad no longer exists.", "error");
    await db.favorite.create({ data: { userId: user.id, listingId, priceAtSave: listing.priceNpr } });
  }
  await flash(has ? "Removed from saved bikes." : "Saved. Find it under Saved.");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/saved");
}

// ---------- chat ----------

export async function startThread(formData: FormData) {
  const listingId = String(formData.get("id"));
  const user = await requireUser(`/listings/${listingId}`);
  if (!(await rateLimit(`thread:start:${user.id}`, 20, HOUR))) {
    await flash("You have started too many conversations. Try again later.", "error");
    redirect(`/listings/${listingId}`);
  }
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE" || listing.sellerId === user.id) {
    await flash("You cannot message about this ad.", "error");
    redirect(`/listings/${listingId}`);
  }
  const thread = await db.thread.upsert({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    update: {},
    create: { listingId, buyerId: user.id },
  });
  redirect(`/inbox/${thread.id}`);
}

export async function sendMessage(threadId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(`/inbox/${threadId}`);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return undefined;
  if (body.length > 1000) return { error: "Message is too long." };
  if (!(await rateLimit(`msg:${user.id}`, 30, MINUTE))) return { error: "You are sending messages too fast." };
  const t = await db.thread.findUnique({ where: { id: threadId }, include: { listing: true } });
  if (!t || (t.buyerId !== user.id && t.listing.sellerId !== user.id)) return { error: "Conversation not found." };
  await db.$transaction([
    db.message.create({ data: { threadId, senderId: user.id, body } }),
    db.thread.update({ where: { id: threadId }, data: t.buyerId === user.id ? { buyerReadAt: new Date() } : { sellerReadAt: new Date() } }),
  ]);
  revalidatePath(`/inbox/${threadId}`);
  return undefined;
}

// ---------- reports & moderation ----------

export async function reportListing(_: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id"));
  const user = await requireUser(`/listings/${id}`);
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Tell us briefly what is wrong." };
  if (!(await rateLimit(`report:${user.id}`, 10, HOUR))) return { error: "Too many reports. Try again later." };
  await db.report.create({ data: { listingId: id, reporterId: user.id, reason: reason.slice(0, 500) } });
  return { error: undefined, fieldErrors: { done: "1" } };
}

export async function approveListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await db.listing.update({ where: { id }, data: { status: "ACTIVE", rejectReason: null } });
  // price-drop and saved-search emails go out after the response so approving stays instant
  after(() => notifyListingLive(id).catch((e) => console.error("alerts failed", e)));
  await flash("Ad approved and now live.");
  revalidatePath("/admin", "layout");
}

export async function rejectListing(formData: FormData) {
  await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || "Does not meet our listing guidelines.";
  await db.listing.update({ where: { id: String(formData.get("id")) }, data: { status: "REJECTED", rejectReason: reason } });
  await flash("Ad rejected.");
  revalidatePath("/admin", "layout");
}

export async function resolveReport(formData: FormData) {
  await requireAdmin();
  await db.report.update({ where: { id: String(formData.get("id")) }, data: { resolved: true } });
  await flash("Report marked as resolved.");
  revalidatePath("/admin", "layout");
}

export async function setBanned(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const ban = formData.get("ban") === "1";
  if (id === admin.id) return flash("You cannot suspend yourself.", "error");
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role === "ADMIN") return flash("That account cannot be suspended.", "error");
  await db.$transaction([
    db.user.update({ where: { id }, data: { banned: ban } }),
    ...(ban
      ? [db.listing.updateMany({
          where: { sellerId: id, status: { in: ["ACTIVE", "PENDING"] } },
          data: { status: "REJECTED", rejectReason: "Account suspended." },
        })]
      : []),
  ]);
  await flash(ban ? "Account suspended." : "Account restored.");
  revalidatePath("/admin", "layout");
}

export async function setRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.id) return flash("You cannot change your own role.", "error");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "USER";
  await db.user.update({ where: { id }, data: { role } });
  await flash(role === "ADMIN" ? "Made admin." : "Admin removed.");
  revalidatePath("/admin", "layout");
}

// ---------- reviews ----------

export async function submitReview(sellerId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(`/sellers/${sellerId}`);
  const parsed = reviewSchema.safeParse({ rating: formData.get("rating"), comment: String(formData.get("comment") ?? "") });
  if (!parsed.success) return fieldErrors(parsed.error, formData);
  const seller = await db.user.findUnique({ where: { id: sellerId }, select: { id: true, banned: true } });
  if (!seller || seller.banned) return { error: "Seller not found." };
  const eligible = await reviewEligibility(user.id, sellerId);
  if (eligible === "self") return { error: "You cannot review yourself." };
  if (eligible === "no_contact") return { error: "You can review a seller after you have messaged them." };
  if (!(await rateLimit(`review:${user.id}`, 10, HOUR))) return { error: "Too many reviews. Try again later." };
  const key = { reviewerId_sellerId: { reviewerId: user.id, sellerId } };
  await db.review.upsert({ where: key, update: parsed.data, create: { ...parsed.data, reviewerId: user.id, sellerId } });
  revalidatePath(`/sellers/${sellerId}`);
  revalidatePath("/listings");
  return { fieldErrors: { done: "1" } };
}

export async function deleteReview(formData: FormData) {
  const user = await requireUser("/");
  const r = await db.review.findUnique({ where: { id: String(formData.get("id")) } });
  if (!r || (r.reviewerId !== user.id && user.role !== "ADMIN")) return flash("We could not delete that review.", "error");
  await db.review.delete({ where: { id: r.id } });
  await flash("Review deleted.");
  revalidatePath(`/sellers/${r.sellerId}`);
}

// ---------- saved searches ----------

const MAX_SAVED_SEARCHES = 10;

export async function saveSearch(formData: FormData) {
  const user = await requireUser("/listings");
  const f = filtersFromQuery(String(formData.get("query") ?? ""));
  const query = filtersToQuery(f);
  const back = `/listings${query ? `?${query}` : ""}`;
  if (!query) {
    await flash("Pick at least one filter before saving a search.", "error");
    redirect(back);
  }
  if ((await db.savedSearch.count({ where: { userId: user.id } })) >= MAX_SAVED_SEARCHES) {
    await flash(`You can keep up to ${MAX_SAVED_SEARCHES} saved searches.`, "error");
    redirect(back);
  }
  await db.savedSearch.upsert({
    where: { userId_query: { userId: user.id, query } },
    update: {},
    create: { userId: user.id, query, label: describeFilters(f).slice(0, 120) },
  });
  await flash("Search saved. We will email you when a new bike matches.");
  revalidatePath("/saved");
  redirect(back);
}

export async function deleteSavedSearch(formData: FormData) {
  const user = await requireUser("/saved");
  await db.savedSearch.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  await flash("Saved search removed.");
  revalidatePath("/saved");
}

// ---------- featured ads ----------

export async function featureListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const days = Number(formData.get("days"));
  const l = await db.listing.findUnique({ where: { id }, select: { status: true } });
  if (!l) return flash("Ad not found.", "error");
  if (days === 0) {
    await db.listing.update({ where: { id }, data: { featuredUntil: null } });
    await flash("Ad is no longer featured.");
  } else if ((FEATURE_DAYS as readonly number[]).includes(days) && l.status === "ACTIVE") {
    await db.listing.update({ where: { id }, data: { featuredUntil: new Date(Date.now() + days * 86_400_000) } });
    await flash(`Ad featured for ${days} days.`);
  } else {
    return flash("Only live ads can be featured.", "error");
  }
  revalidatePath("/", "layout");
}
