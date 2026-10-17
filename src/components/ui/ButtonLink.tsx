import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";

const button = cva("", {
  variants: {
    variant: {
      primary: "btn-primary",
      outline: "btn-outline",
      // on an inverse (dark) band
      onColor: "btn bg-canvas text-ink active:bg-cream",
    },
  },
  defaultVariants: { variant: "primary" },
});

type Props = React.ComponentProps<typeof Link> & VariantProps<typeof button>;

export function ButtonLink({ variant, className, ...rest }: Props) {
  return <Link className={cn(button({ variant }), className)} {...rest} />;
}
