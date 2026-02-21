interface WineAttributeBarProps {
  label: string;
  /** Single value (backward compatible). Ignored when both minValue and maxValue are provided. */
  value?: number;
  /** Range min. When both minValue and maxValue are set, renders a band and "min–max" label. */
  minValue?: number;
  /** Range max. */
  maxValue?: number;
  /** Scale maximum (e.g. dimension.scaleMax). Default 6. */
  max?: number;
}

export function WineAttributeBar({
  label,
  value,
  minValue: minProp,
  maxValue: maxProp,
  max = 6,
}: WineAttributeBarProps) {
  const scaleMax = Math.max(1, max);
  const useRangeInput = minProp != null && maxProp != null;
  const min = useRangeInput ? Math.min(minProp, maxProp) : (maxProp ?? minProp ?? value ?? 0);
  const maxVal = useRangeInput ? Math.max(minProp, maxProp) : (minProp ?? maxProp ?? value ?? 0);
  const displayMin = Math.max(0, Math.min(min, scaleMax));
  const displayMax = Math.max(0, Math.min(maxVal, scaleMax));

  const isRange = useRangeInput && displayMin !== displayMax;
  const minPct = (displayMin / scaleMax) * 100;
  const leftPct = (displayMin / scaleMax) * 100;
  const widthPct = ((displayMax - displayMin) / scaleMax) * 100;
  const singlePct = isRange ? 0 : (displayMax / scaleMax) * 100;

  const labelText =
    displayMin === 0 && displayMax === 0
      ? "\u2013"
      : isRange
        ? `${displayMin}\u2013${displayMax}/${scaleMax}`
        : `${displayMax}/${scaleMax}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-sans tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-xs font-sans font-semibold text-foreground/70">
          {labelText}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden relative">
        {isRange ? (
          <>
            <div
              className="absolute inset-y-0 left-0 h-full rounded-l-full bg-gradient-to-r from-wine-deep to-wine-rich transition-all duration-700 ease-out"
              style={{ width: `${minPct}%` }}
            />
            <div
              className="absolute inset-y-0 h-full rounded-r-full bg-wine-rich/40 transition-all duration-700 ease-out"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
            />
          </>
        ) : (
          <div
            className="h-full rounded-full bg-gradient-to-r from-wine-deep to-wine-rich transition-all duration-700 ease-out"
            style={{ width: `${singlePct}%` }}
          />
        )}
      </div>
    </div>
  );
}
