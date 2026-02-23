import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { WineStyleFull } from "@wine-app/shared";
import { getOrdinalLabel } from "@wine-app/shared";

const CLIMATE_LABELS = [
  "Cool",
  "Moderate-Cool",
  "Moderate",
  "Moderate-Warm",
  "Warm",
] as const;

function getStructMid(style: WineStyleFull, dimId: string): number | null {
  const row = (style.structure ?? []).find(
    (s) => s.structureDimensionId === dimId
  );
  if (!row || row.minValue == null) return null;
  const max = row.maxValue ?? row.minValue;
  return (row.minValue + max) / 2;
}

function getClimateLabel(style: WineStyleFull): string {
  const labels = style.climateOrdinalScale?.labels;
  const min = style.climateMin;
  if (labels && min != null) {
    const label = getOrdinalLabel(labels, min);
    if (label) return label;
  }
  return "Moderate";
}

type ClimateGradientProps = {
  styles: WineStyleFull[];
  colorFilter: "red" | "white" | null;
  activeBandIndex: number;
  height?: number;
  onBandIndexChange?: (index: number) => void;
};

export function ClimateGradient({
  styles,
  colorFilter,
  activeBandIndex,
  height = 480,
  onBandIndexChange,
}: ClimateGradientProps) {
  const [selectedStyle, setSelectedStyle] = useState<WineStyleFull | null>(null);

  const filtered = useMemo(() => {
    if (!colorFilter) return styles;
    return styles.filter((s) => s.producedColor === colorFilter);
  }, [styles, colorFilter]);

  const byBand = useMemo(() => {
    const map: Record<string, WineStyleFull[]> = {};
    for (const label of CLIMATE_LABELS) map[label] = [];
    for (const s of filtered) {
      const band = getClimateLabel(s);
      if (band in map) map[band].push(s);
      else map["Moderate"].push(s);
    }
    return map;
  }, [filtered]);

  const bandHeight = height / CLIMATE_LABELS.length;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div
        className="relative rounded-xl overflow-hidden border border-border flex-shrink-0"
        style={{
          width: 320,
          height,
          background: "linear-gradient(to bottom, hsl(var(--slate-cool)), hsl(var(--border)), hsl(var(--terracotta-warm)))",
        }}
      >
        {CLIMATE_LABELS.map((bandId, index) => {
          const bandStyles = byBand[bandId] ?? [];
          const isActive = activeBandIndex === index;
          const isEmpty = bandStyles.length === 0;
          const top = index * bandHeight;
          return (
            <div
              key={bandId}
              className="absolute left-0 right-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
              style={{
                top,
                height: bandHeight,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <span className="font-serif text-sm text-foreground/90">
                {bandId}
              </span>
              {isEmpty ? (
                <span className="text-xs text-muted-foreground font-sans">
                  No styles in seed
                </span>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <AnimatePresence mode="wait">
                    {bandStyles.map((style, i) => (
                      <motion.div
                        key={style.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative flex flex-col items-center"
                        style={{
                          left: (i - (bandStyles.length - 1) / 2) * 44,
                          top: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedStyle(selectedStyle?.id === style.id ? null : style)}
                          aria-label={`${style.displayName} structure`}
                          className="w-8 h-8 rounded-full bg-wine-deep flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-wine-deep/30 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        />
                        <span className="mt-1 text-[10px] font-sans text-foreground/80 whitespace-nowrap max-w-[80px] truncate block text-center">
                          <Link
                            to={`/explore/styles/${style.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {style.displayName}
                          </Link>
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Band focus and callout */}
      <div className="flex flex-col gap-4 min-w-[200px]">
        <label className="text-sm font-sans text-muted-foreground">
          Focus band
        </label>
        <input
          type="range"
          min={0}
          max={CLIMATE_LABELS.length - 1}
          value={activeBandIndex}
          onChange={(e) => onBandIndexChange?.(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Focus climate band"
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-serif text-sm text-foreground mb-2">
            In warmer climates, expect higher alcohol, riper fruit, and lower acidity.
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Use the slider to highlight each thermal band. Styles are placed by their typical climate.
          </p>
        </div>
      </div>

      {/* Selected style structural callout */}
      <AnimatePresence>
        {selectedStyle && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="rounded-lg border border-border bg-card p-4 min-w-[200px]"
          >
            <p className="font-serif font-semibold text-foreground mb-2">
              {selectedStyle.displayName}
            </p>
            <ul className="font-sans text-sm text-muted-foreground space-y-1">
              {["acidity", "tannins", "alcohol", "body", "oak_influence", "overall_intensity"].map(
                (dimId) => {
                  const v = getStructMid(selectedStyle, dimId);
                  if (v == null) return null;
                  const label = dimId.replace(/_/g, " ");
                  return (
                    <li key={dimId}>
                      {label}: {v}
                    </li>
                  );
                }
              )}
            </ul>
            <Link
              to={`/explore/styles/${selectedStyle.id}`}
              className="mt-2 inline-block text-xs text-primary font-sans hover:underline"
            >
              View full profile →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
