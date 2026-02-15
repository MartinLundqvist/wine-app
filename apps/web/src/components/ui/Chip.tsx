import { type HTMLAttributes } from "react";

type Variant = "base" | "selected" | "correct" | "incorrect";

const variants: Record<Variant, string> = {
  base: "rounded-chip border border-cork-500 px-2 py-1 text-small text-linen-100 bg-cellar-800",
  selected:
    "rounded-chip border-2 border-burgundy-700 px-2 py-1 text-small text-linen-100 bg-burgundy-800/50",
  correct:
    "rounded-chip border-2 border-moss-600 px-2 py-1 text-small text-linen-100 bg-moss-700/30",
  incorrect:
    "rounded-chip border-2 border-oxblood-700 px-2 py-1 text-small text-linen-100 bg-oxblood-700/20",
};

export function Chip({
  variant = "base",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center font-ui ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
