import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type ExplorePageShellProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  backTo?: { path: string; label: string };
  children: ReactNode;
};

export function ExplorePageShell({
  title,
  subtitle,
  icon,
  backTo = { path: "/explore", label: "Back to Explore" },
  children,
}: ExplorePageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-hero">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-24 md:pb-28">
          {backTo && (
            <Link
              to={backTo.path}
              className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-8 text-sm font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              {backTo.label}
            </Link>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            {icon}
            <p className="text-sm tracking-[0.25em] uppercase text-wine-light font-sans">
              Explore
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg max-w-2xl font-sans leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>

      {children}
    </div>
  );
}
