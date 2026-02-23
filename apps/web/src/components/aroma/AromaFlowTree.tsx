import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { AromaTermFlat } from "@wine-app/shared";
import { Chip } from "../ui/Chip";

type AromaSource = "primary" | "secondary" | "tertiary";

const SOURCE_COLORS: Record<
  AromaSource,
  { border: string; bg: string; dot: string; label: string }
> = {
  primary: {
    border: "border-primary",
    bg: "bg-primary/20",
    dot: "bg-primary",
    label: "Primary",
  },
  secondary: {
    border: "border-oak",
    bg: "bg-oak/20",
    dot: "bg-oak",
    label: "Secondary",
  },
  tertiary: {
    border: "border-moss-600",
    bg: "bg-moss-700/20",
    dot: "bg-moss-600",
    label: "Tertiary",
  },
};

const SOURCE_ORDER: AromaSource[] = ["primary", "secondary", "tertiary"];

function buildByParent(terms: AromaTermFlat[]) {
  const byParent = new Map<string | null, AromaTermFlat[]>();
  for (const t of terms) {
    const key = t.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  return byParent;
}

export function AromaFlowTree({ terms }: { terms: AromaTermFlat[] }) {
  const reducedMotion = useReducedMotion();
  const byParent = useMemo(() => buildByParent(terms), [terms]);
  const roots = useMemo(
    () =>
      (byParent.get(null) ?? []).filter(
        (r): r is AromaTermFlat & { source: "primary" | "secondary" | "tertiary" } =>
          r.source != null
      ),
    [byParent]
  );

  const [selectedSource, setSelectedSource] = useState<AromaTermFlat | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<AromaTermFlat | null>(
    null
  );
  const hasPreselected = useRef(false);

  // Preselect first source once when data loads so the explorer doesn't start blank
  useEffect(() => {
    if (roots.length > 0 && !hasPreselected.current) {
      hasPreselected.current = true;
      setSelectedSource(roots[0]);
    }
  }, [roots]);

  const clusters = useMemo(
    () =>
      selectedSource ? byParent.get(selectedSource.id) ?? [] : [],
    [byParent, selectedSource]
  );
  const descriptors = useMemo(
    () =>
      selectedCluster ? byParent.get(selectedCluster.id) ?? [] : [],
    [byParent, selectedCluster]
  );

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" as const };

  return (
    <div className="relative min-h-[420px]">
      {/* Utility row: legend + counts */}
      <div
        className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border"
        role="presentation"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-sans text-muted-foreground uppercase tracking-wider font-medium">
            Source
          </span>
          {SOURCE_ORDER.map((src) => (
            <span
              key={src}
              className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground"
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${SOURCE_COLORS[src].dot}`}
                aria-hidden
              />
              {SOURCE_COLORS[src].label}
            </span>
          ))}
        </div>
        <span className="text-xs font-sans text-muted-foreground">
          {selectedSource && (
            <>
              {clusters.length} cluster{clusters.length !== 1 ? "s" : ""}
              {selectedCluster && (
                <> · {descriptors.length} descriptor{descriptors.length !== 1 ? "s" : ""}</>
              )}
            </>
          )}
        </span>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="relative hidden md:grid grid-cols-3 gap-8 transition-opacity duration-200">
        {/* Column 1: Sources */}
        <section
          className="flex flex-col"
          aria-label="Aroma source: choose primary, secondary, or tertiary"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            1. Source
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Where the aroma comes from (grape, fermentation, aging).
          </p>
          <div className="flex flex-col gap-3">
            {roots.map((r) => {
              const colors = SOURCE_COLORS[r.source as AromaSource];
              const isSelected = selectedSource?.id === r.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedSource(isSelected ? null : r);
                    setSelectedCluster(null);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${r.displayName}${r.description ? `: ${r.description}` : ""}`}
                  transition={transition}
                  className={`text-left rounded-xl p-4 border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${colors.border} ${colors.bg} ${
                    isSelected
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md"
                      : "hover:shadow-sm hover:border-opacity-80"
                  }`}
                >
                  <span className="font-serif text-xl text-foreground block">
                    {r.displayName}
                  </span>
                  {r.description && (
                    <span className="text-sm text-muted-foreground mt-0.5 block">
                      {r.description}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Column 2: Clusters */}
        <section
          className="flex flex-col"
          aria-label="Aroma cluster: choose a category within the source"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            2. Cluster
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Group of related descriptors (e.g. stone fruit, spices).
          </p>
          {selectedSource ? (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
              {clusters.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">
                  No clusters for this source.
                </p>
              ) : (
                clusters.map((c) => {
                  const colors = SOURCE_COLORS[c.source as AromaSource];
                  const isSelected = selectedCluster?.id === c.id;
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedCluster(isSelected ? null : c)
                      }
                      aria-pressed={isSelected}
                      aria-label={c.displayName}
                      transition={transition}
                      className={`text-left rounded-lg px-4 py-3 border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${colors.border} ${colors.bg} ${
                        isSelected
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-sm"
                          : "hover:shadow-sm hover:border-opacity-80"
                      }`}
                    >
                      <span className="font-sans text-base font-medium text-foreground">
                        {c.displayName}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans mt-2">
              Select a source first.
            </p>
          )}
        </section>

        {/* Column 3: Descriptors */}
        <section
          className="flex flex-col"
          aria-label="Aroma descriptors: specific terms for tasting"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            3. Descriptors
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Specific words to use when describing the wine.
          </p>
          {selectedCluster ? (
            <div className="flex flex-wrap gap-2 content-start overflow-y-auto max-h-[320px]">
              {descriptors.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">
                  No descriptors in this cluster.
                </p>
              ) : (
                descriptors.map((d) => (
                  <Chip
                    key={d.id}
                    variant="ghost"
                    className="cursor-default bg-secondary/50 border-border text-foreground font-sans"
                    title={d.description ?? undefined}
                  >
                    {d.displayName}
                  </Chip>
                ))
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans mt-2">
              {selectedSource
                ? "Select a cluster to see descriptors."
                : "Select a source first."}
            </p>
          )}
        </section>
      </div>

      {/* Mobile: stacked step-based sections */}
      <div className="md:hidden flex flex-col gap-8">
        <section
          aria-label="Step 1: Aroma source"
          className="flex flex-col"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            1. Source
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Where the aroma comes from.
          </p>
          <div className="flex flex-col gap-3">
            {roots.map((r) => {
              const colors = SOURCE_COLORS[r.source as AromaSource];
              const isSelected = selectedSource?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedSource(isSelected ? null : r);
                    setSelectedCluster(null);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${r.displayName}${r.description ? `: ${r.description}` : ""}`}
                  className={`text-left rounded-xl p-4 border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${colors.border} ${colors.bg} ${
                    isSelected
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md"
                      : "hover:shadow-sm"
                  }`}
                >
                  <span className="font-serif text-xl text-foreground block">
                    {r.displayName}
                  </span>
                  {r.description && (
                    <span className="text-sm text-muted-foreground mt-0.5 block">
                      {r.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-label="Step 2: Aroma cluster"
          className="flex flex-col"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            2. Cluster
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Group of related descriptors.
          </p>
          {selectedSource ? (
            <div className="flex flex-col gap-2">
              {clusters.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">
                  No clusters for this source.
                </p>
              ) : (
                clusters.map((c) => {
                  const colors = SOURCE_COLORS[c.source as AromaSource];
                  const isSelected = selectedCluster?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedCluster(isSelected ? null : c)
                      }
                      aria-pressed={isSelected}
                      aria-label={c.displayName}
                      className={`text-left rounded-lg px-4 py-3 border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${colors.border} ${colors.bg} ${
                        isSelected
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-sm"
                          : "hover:shadow-sm"
                      }`}
                    >
                      <span className="font-sans text-base font-medium text-foreground">
                        {c.displayName}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans">
              Select a source above first.
            </p>
          )}
        </section>

        <section
          aria-label="Step 3: Aroma descriptors"
          className="flex flex-col"
        >
          <h2 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider mb-1">
            3. Descriptors
          </h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Specific tasting terms.
          </p>
          {selectedCluster ? (
            <div className="flex flex-wrap gap-2">
              {descriptors.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">
                  No descriptors in this cluster.
                </p>
              ) : (
                descriptors.map((d) => (
                  <Chip
                    key={d.id}
                    variant="ghost"
                    className="cursor-default bg-secondary/50 border-border text-foreground font-sans"
                    title={d.description ?? undefined}
                  >
                    {d.displayName}
                  </Chip>
                ))
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans">
              {selectedSource
                ? "Select a cluster to see descriptors."
                : "Select a source first."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
