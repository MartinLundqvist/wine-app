import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type TooltipProps = {
  visible: boolean;
  x: number;
  y: number;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ visible, x, y, children, className = "" }: TooltipProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`fixed z-50 pointer-events-none rounded-lg border border-border bg-card shadow-soft p-3 max-w-[280px] ${className}`}
          style={{ left: x + 12, top: y + 12 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
