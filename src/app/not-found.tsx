import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="text-5xl sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The ad may have been sold or removed. Browse the latest bikes instead.</p>
      <ButtonLink href="/listings" className="mt-8">Browse bikes</ButtonLink>
    </div>
  );
}
