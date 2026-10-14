import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The ad may have been sold or removed.</p>
      <Link href="/listings" className="btn-primary mt-6">Browse bikes</Link>
    </div>
  );
}
