import { type HTMLAttributes } from "react";

type Variant = "base" | "selected" | "correct" | "incorrect" | "ghost";

const variants: Record<Variant, string> = {
  base: "rounded-full border border-muted-foreground px-2 py-1 text-sm text-foreground bg-card",
  selected:
    "rounded-full border-2 border-primary px-2 py-1 text-sm text-foreground bg-primary/50",
  correct:
    "rounded-full border-2 border-moss-600 px-2 py-1 text-sm text-foreground bg-moss-700/30",
  incorrect:
    "rounded-full border-2 border-destructive px-2 py-1 text-sm text-foreground bg-destructive/20",
  ghost:
    "rounded-full border border-muted-foreground/30 px-1.5 py-0.5 text-xs text-muted-foreground bg-card/60 leading-tight",
};

export function Chip({
  variant = "base",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center font-sans ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
