interface GrapePercentageIndicatorProps {
  /** Array of grape entries with optional percentage */
  grapes: { percentage?: number | null }[];
  /** Show validation message when total !== 100 and at least one percentage is set */
  showValidationMessage?: boolean;
}

export function GrapePercentageIndicator({
  grapes,
  showValidationMessage = true,
}: GrapePercentageIndicatorProps) {
  const total = grapes.reduce(
    (sum, g) => sum + (g.percentage != null ? g.percentage : 0),
    0
  );
  const hasAnyPercentage = grapes.some((g) => g.percentage != null && g.percentage > 0);
  const isExact = total === 100;
  const isOver = total > 100;
  const isUnder = hasAnyPercentage && total < 100;
  const showError = hasAnyPercentage && total !== 100 && showValidationMessage;

  const statusColor = isExact
    ? "text-green-600 dark:text-green-400"
    : isOver
      ? "text-destructive"
      : isUnder
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  const barColor = isExact
    ? "bg-green-500"
    : isOver
      ? "bg-destructive"
      : isUnder
        ? "bg-amber-500"
        : "bg-muted";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[120px]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, (total / 100) * 100)}%` }}
          />
        </div>
        <span className={`text-sm font-sans font-medium tabular-nums ${statusColor}`}>
          {total} / 100%
        </span>
      </div>
      {showError && (
        <p className="text-sm text-destructive">
          {total > 100
            ? "Grape percentages must not exceed 100%."
            : "Grape percentages should total 100%."}
        </p>
      )}
    </div>
  );
}
