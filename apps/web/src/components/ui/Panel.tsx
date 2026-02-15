import { type HTMLAttributes } from "react";

type Variant = "oak" | "linenCard" | "linenSheet";

const variants: Record<Variant, string> = {
  oak: "bg-oak-800 border border-cork-500/50 rounded-card p-6 text-linen-100",
  linenCard:
    "bg-linen-100 text-cellar-950 border border-cork-300 rounded-card p-5",
  linenSheet:
    "bg-linen-50 text-cellar-950 rounded-card shadow-lift2 max-w-xl p-6",
};

export function Panel({
  variant = "oak",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div className={`font-ui ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
