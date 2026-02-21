import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-wine-light focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-md px-4 py-2 transition-colors duration-200",
  secondary:
    "bg-transparent border border-oak text-foreground hover:bg-oak hover:border-oak focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-md px-4 py-2 transition-colors duration-200",
  tertiary:
    "bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground border border-transparent rounded-md px-4 py-2 transition-colors duration-150",
  destructive:
    "bg-transparent border border-destructive text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-accent rounded-md px-4 py-2 transition-colors duration-200",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`font-sans text-base ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
