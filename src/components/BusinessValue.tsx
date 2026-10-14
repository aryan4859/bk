// Renders a business detail, making email and phone tappable.
export function BusinessValue({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  if (label === "Email") return <a className={className} href={`mailto:${value}`}>{value}</a>;
  if (label === "Phone") return <a className={className} href={`tel:${value.replace(/[^\d+]/g, "")}`}>{value}</a>;
  return <>{value}</>;
}
