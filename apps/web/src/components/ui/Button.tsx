import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

const variants: Record<Variant, string> = {
  primary:
    "bg-burgundy-700 text-linen-100 hover:bg-burgundy-600 focus:ring-2 focus:ring-brass-500 focus:ring-offset-2 focus:ring-offset-cellar-950 rounded-control px-4 py-2 transition-colors duration-base",
  secondary:
    "bg-transparent border border-oak-600 text-linen-100 hover:bg-oak-700 hover:border-oak-600 focus:ring-2 focus:ring-brass-500 focus:ring-offset-2 rounded-control px-4 py-2 transition-colors duration-base",
  tertiary:
    "bg-transparent text-cork-400 hover:text-linen-100 hover:border-cork-500 border border-transparent rounded-control px-4 py-2 transition-colors duration-fast",
  destructive:
    "bg-transparent border border-oxblood-700 text-oxblood-700 hover:bg-oxblood-700/20 focus:ring-2 focus:ring-brass-500 rounded-control px-4 py-2 transition-colors duration-base",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`font-ui text-body ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
