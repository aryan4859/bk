import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const chip = cva("inline-flex items-center rounded-sm text-sm", {
  variants: {
    tone: {
      soft: "bg-wash px-2 py-0.5 text-ink",
      dark: "bg-ink px-2 py-0.5 font-medium text-white",
      // the price plate: the one memorable element of the design
      price: "bg-accent px-2.5 py-1 font-display text-xl text-ink",
    },
  },
  defaultVariants: { tone: "soft" },
});

type Props = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof chip>;

export function Chip({ tone, className, ...rest }: Props) {
  return <span className={cn(chip({ tone }), className)} {...rest} />;
}
