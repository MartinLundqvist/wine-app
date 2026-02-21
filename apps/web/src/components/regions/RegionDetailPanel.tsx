import { useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { Region } from "@wine-app/shared";
import type { StyleTargetFull } from "@wine-app/shared";

type RegionDetailPanelProps = {
  country: string;
  regions: Region[];
  styleTargets: StyleTargetFull[];
  onClose: () => void;
  onHoverSubRegion?: (regionId: string | null) => void;
};

const slideRight = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

const slideUp = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true,
  );
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIsDesktop(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  return isDesktop;
}

export function RegionDetailPanel({
  country,
  regions,
  styleTargets,
  onClose,
  onHoverSubRegion,
}: RegionDetailPanelProps) {
  const reducedMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useIsDesktop();

  const { rootRegion, subRegions, stylesByRegionId } = useMemo(() => {
    const rootRegion = regions.find(
      (r) => (r.parentRegionId ?? null) === null && r.country === country,
    );
    if (!rootRegion) {
      return {
        rootRegion: null,
        subRegions: [] as Region[],
        stylesByRegionId: new Map<string, StyleTargetFull[]>(),
      };
    }
    const subRegions = regions
      .filter((r) => r.parentRegionId === rootRegion.id)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const stylesByRegionId = new Map<string, StyleTargetFull[]>();
    for (const st of styleTargets) {
      if (st.regionId) {
        const list = stylesByRegionId.get(st.regionId) ?? [];
        list.push(st);
        stylesByRegionId.set(st.regionId, list);
      }
    }
    return { rootRegion, subRegions, stylesByRegionId };
  }, [country, regions, styleTargets]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [country]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!rootRegion) return null;

  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.25 };
  const variants = reducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : isDesktop
      ? slideRight
      : slideUp;

  const panelContent = (
    <>
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border flex-shrink-0">
        <h2
          id="region-panel-title"
          className="font-serif text-xl text-foreground"
        >
          {country}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-4 pr-2 lg:pr-2 pb-8 lg:pb-4">
        {subRegions.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">
            No sub-regions in this country.
          </p>
        ) : (
          subRegions.map((sub) => {
            const styles = stylesByRegionId.get(sub.id) ?? [];
            return (
              <div
                key={sub.id}
                className="space-y-2"
                onMouseEnter={() => onHoverSubRegion?.(sub.id)}
                onMouseLeave={() => onHoverSubRegion?.(null)}
              >
                <h3 className="font-sans text-base text-foreground font-medium">
                  {sub.displayName}
                </h3>
                {styles.length > 0 ? (
                  <ul className="space-y-1 ml-0 list-none">
                    {styles.map((st) => (
                      <li key={st.id}>
                        <Link
                          to={`/explore/styles/${st.id}`}
                          className="text-sm text-muted-foreground hover:text-oak-light no-underline font-sans focus:outline-none focus:underline"
                        >
                          {st.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">
                    No styles linked
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{}}
      animate={{}}
      exit={{}}
      aria-hidden
    >
      {/* Backdrop — keeps map visible, blocks map interaction while open */}
      <motion.div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition as { duration: number }}
        onClick={onClose}
        aria-hidden
      />

      {/* Single panel: right drawer on desktop, bottom sheet on mobile */}
      <motion.div
        className="absolute z-20 flex flex-col bg-card border-border shadow-soft overflow-hidden
          inset-x-0 bottom-0 max-h-[70vh] rounded-t-xl border-t
          lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:max-h-none lg:w-full lg:max-w-sm lg:rounded-none lg:border-l lg:border-t-0"
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition as { duration: number; type?: "tween" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="region-panel-title"
      >
        {panelContent}
      </motion.div>
    </motion.div>
  );
}
