import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const variantStyles = {
  default: {
    aspect: "aspect-[16/10]",
    overlay:
      "bg-gradient-to-t from-cellar via-cellar/50 to-transparent",
    padding: "p-6 md:p-8",
    title: "text-2xl md:text-3xl",
  },
  featured: {
    aspect: "aspect-[21/9]",
    overlay:
      "bg-gradient-to-t from-cellar via-cellar/60 to-transparent",
    padding: "p-8 md:p-12",
    title: "text-3xl md:text-5xl",
  },
} as const;

export type OverlayImageCardProps = {
  to: string;
  image: string;
  alt: string;
  variant?: "default" | "featured";
  label?: string;
  title: string;
  subtitle?: string;
  description: string;
  ctaText: string;
  lazy?: boolean;
  titleClassName?: string;
};

export function OverlayImageCard({
  to,
  image,
  alt,
  variant = "default",
  label,
  title,
  subtitle,
  description,
  ctaText,
  lazy = true,
  titleClassName,
}: OverlayImageCardProps) {
  const styles = variantStyles[variant];
  const titleClasses = titleClassName ?? styles.title;

  return (
    <Link
      to={to}
      className="group block relative overflow-hidden rounded-2xl shadow-soft hover:shadow-wine transition-shadow duration-500"
    >
      <div className={`${styles.aspect} relative`}>
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading={lazy ? "lazy" : undefined}
        />
        <div className={`absolute inset-0 ${styles.overlay}`} />

        <div
          className={`absolute inset-0 flex flex-col justify-end ${styles.padding}`}
        >
          {label && (
            <span className="text-xs font-sans tracking-wider uppercase text-wine-light mb-2">
              {label}
            </span>
          )}
          <h2
            className={`font-serif ${titleClasses} font-bold text-primary-foreground mb-1`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm font-sans text-primary-foreground/60 tracking-wide uppercase mb-3">
              {subtitle}
            </p>
          )}
          <p className="text-primary-foreground/80 text-sm md:text-base font-sans leading-relaxed max-w-md mb-4">
            {description}
          </p>
          <div className="flex items-center gap-2 text-wine-light font-sans text-sm font-medium group-hover:gap-3 transition-all duration-300">
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
