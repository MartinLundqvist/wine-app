import { type HTMLAttributes } from "react";

type Variant = "oak" | "linenCard" | "linenSheet";

const variants: Record<Variant, string> = {
  oak: "bg-oak border border-muted-foreground/50 rounded-lg p-6 text-foreground",
  linenCard:
    "bg-card text-foreground border border-border rounded-lg p-5",
  linenSheet:
    "bg-cream text-foreground rounded-lg shadow-soft max-w-xl p-6",
};

export function Panel({
  variant = "oak",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div className={`font-sans ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
