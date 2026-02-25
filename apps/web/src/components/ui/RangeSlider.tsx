import { useState } from "react";

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  /** Ordinal labels for tooltip (e.g. ["Light", "Medium", "Full"]). Index 0 = value 1. */
  labels?: string[];
  /** Optional label shown above the slider */
  label?: string;
  /** Optional id for the wrapper (for accessibility) */
  id?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value: [minVal, maxVal],
  onChange,
  labels,
  label,
  id,
}: RangeSliderProps) {
  const [hoveredThumb, setHoveredThumb] = useState<"min" | "max" | null>(null);

  const clampMin = (v: number) => Math.min(max, Math.max(min, Math.min(v, maxVal)));
  const clampMax = (v: number) => Math.max(min, Math.min(max, Math.max(v, minVal)));

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([clampMin(Number(e.target.value)), maxVal]);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([minVal, clampMax(Number(e.target.value))]);
  };

  const scale = max - min || 1;
  const leftPct = ((minVal - min) / scale) * 100;
  const widthPct = ((maxVal - minVal) / scale) * 100;

  const getLabel = (v: number) =>
    labels && labels.length > 0 ? labels[v - 1] ?? String(v) : String(v);

  return (
    <div id={id} className="space-y-2 font-sans">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-xs font-semibold text-foreground/70 tabular-nums">
            {minVal === maxVal
              ? `${minVal}`
              : `${minVal}\u2013${maxVal}`}
            {labels?.length
              ? ` (${getLabel(minVal)}${minVal !== maxVal ? ` – ${getLabel(maxVal)}` : ""})`
              : ""}
          </span>
        </div>
      )}
      <div className="relative h-8 flex items-center">
        {/* Track background + filled segment */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-border overflow-hidden pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 h-full rounded-full bg-gradient-to-r from-wine-deep to-wine-rich transition-all duration-200"
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
            }}
          />
        </div>

        {/* Min thumb — full-width, z-index 3 so it stays grabbable at overlap */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onMouseEnter={() => setHoveredThumb("min")}
          onMouseLeave={() => setHoveredThumb(null)}
          title={getLabel(minVal)}
          className="range-slider-input range-slider-min absolute inset-0 w-full h-full appearance-none bg-transparent"
          style={{ zIndex: 3 }}
          aria-valuemin={min}
          aria-valuemax={maxVal}
          aria-valuenow={minVal}
          aria-label="Minimum value"
        />

        {/* Max thumb — full-width, z-index 2 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseEnter={() => setHoveredThumb("max")}
          onMouseLeave={() => setHoveredThumb(null)}
          title={getLabel(maxVal)}
          className="range-slider-input range-slider-max absolute inset-0 w-full h-full appearance-none bg-transparent"
          style={{ zIndex: 2 }}
          aria-valuemin={minVal}
          aria-valuemax={max}
          aria-valuenow={maxVal}
          aria-label="Maximum value"
        />

        {/* Tooltips on hover */}
        {hoveredThumb === "min" && (
          <div
            className="absolute bottom-full mb-1 px-2 py-1 rounded bg-card border border-border text-xs font-sans text-foreground whitespace-nowrap shadow-soft z-20 pointer-events-none -translate-x-1/2"
            style={{ left: `${leftPct}%` }}
          >
            {getLabel(minVal)}
          </div>
        )}
        {hoveredThumb === "max" && (
          <div
            className="absolute bottom-full mb-1 px-2 py-1 rounded bg-card border border-border text-xs font-sans text-foreground whitespace-nowrap shadow-soft z-20 pointer-events-none -translate-x-1/2"
            style={{ left: `${leftPct + widthPct}%` }}
          >
            {getLabel(maxVal)}
          </div>
        )}
      </div>
    </div>
  );
}
