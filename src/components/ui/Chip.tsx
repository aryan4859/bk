import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const chip = cva("inline-flex items-center", {
  variants: {
    tone: {
      soft: "rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-ink",
      dark: "rounded-full bg-dark px-2.5 py-0.5 text-xs font-medium text-on-dark",
      featured: "rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-on-accent",
      price: "rounded-md bg-canvas px-2.5 py-0.5 font-semibold tabular-nums text-ink",
    },
  },
  defaultVariants: { tone: "soft" },
});

type Props = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof chip>;

export function Chip({ tone, className, ...rest }: Props) {
  return <span className={cn(chip({ tone }), className)} {...rest} />;
}
