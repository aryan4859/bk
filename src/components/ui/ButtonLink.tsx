import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";

const button = cva("inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-[15px] font-semibold transition-transform active:scale-[0.97]", {
  variants: {
    variant: {
      primary: "bg-accent text-ink hover:bg-accent-dark",
      outline: "border border-ink bg-white text-ink hover:bg-wash",
    },
  },
  defaultVariants: { variant: "primary" },
});

type Props = React.ComponentProps<typeof Link> & VariantProps<typeof button>;

export function ButtonLink({ variant, className, ...rest }: Props) {
  return <Link className={cn(button({ variant }), className)} {...rest} />;
}
