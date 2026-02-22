import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { lineRadial, curveLinearClosed } from "d3-shape";

export type RadarDimension = {
  id: string;
  displayName: string;
  description?: string | null;
  scaleMax: number;
};

type RadarChartProps = {
  dimensions: RadarDimension[];
  primaryValues: number[];
  secondaryValues?: number[];
  size?: number;
  className?: string;
  /** When provided, dimension labels show this on hover (e.g. WSET definition) */
  onDimensionHover?: (dim: RadarDimension | null) => void;
};

export function RadarChart({
  dimensions,
  primaryValues,
  secondaryValues,
  size = 280,
  className = "",
  onDimensionHover,
}: RadarChartProps) {
  const n = dimensions.length;
  const center = size / 2;
  const radius = center * 0.85;

  const rScale = useMemo(
    () => scaleLinear().domain([0, 1]).range([0, radius]).clamp(true),
    [radius]
  );

  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const points = (values: number[]) =>
    values
      .slice(0, n)
      .map((v, i) => [angle(i), rScale(v)] as [number, number])
      .concat([[angle(0), rScale(values[0] ?? 0)] as [number, number]]);

  const lineGenerator = lineRadial<[number, number]>()
    .angle((d: [number, number]) => d[0])
    .radius((d: [number, number]) => d[1])
    .curve(curveLinearClosed);

  const primaryPath = useMemo(
    () => (primaryValues.length >= n ? lineGenerator(points(primaryValues)) : null),
    [lineGenerator, primaryValues, n]
  );

  const secondaryPath = useMemo(
    () =>
      secondaryValues && secondaryValues.length >= n
        ? lineGenerator(points(secondaryValues))
        : null,
    [lineGenerator, secondaryValues, n]
  );

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  const labelRadius = radius + 20;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Radar chart"
    >
      {/* Radial grid */}
      <g transform={`translate(${center}, ${center})`}>
        {gridLevels.map((level) => (
          <circle
            key={level}
            r={rScale(level)}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
          />
        ))}
        {dimensions.map((_, i) => {
          const a = angle(i);
          const x2 = Math.cos(a) * radius;
          const y2 = Math.sin(a) * radius;
          return (
            <line
              key={dimensions[i].id}
              x1={0}
              y1={0}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Primary shape */}
        {primaryPath && (
          <path
            d={primaryPath}
            fill="hsl(var(--wine-deep) / 0.35)"
            stroke="hsl(var(--wine-rich))"
            strokeWidth={2}
          />
        )}

        {/* Secondary (comparison) shape */}
        {secondaryPath && (
          <path
            d={secondaryPath}
            fill="hsl(var(--gold-muted) / 0.2)"
            stroke="hsl(var(--gold-muted))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Dimension labels */}
        {dimensions.map((dim, i) => {
          const a = angle(i);
          const x = Math.cos(a) * labelRadius;
          const y = Math.sin(a) * labelRadius;
          return (
            <text
              key={dim.id}
              x={x}
              y={y}
              textAnchor={x >= 0 ? "start" : "end"}
              className="fill-foreground font-sans text-xs pointer-events-none select-none"
              style={{ dominantBaseline: "central" }}
            >
              <title>{dim.description ?? dim.displayName}</title>
              {dim.displayName}
            </text>
          );
        })}
      </g>

      {/* Invisible hover targets for dimension labels (larger hit area) */}
      {onDimensionHover &&
        dimensions.map((dim, i) => {
          const a = angle(i);
          const x = Math.cos(a) * labelRadius;
          const y = Math.sin(a) * labelRadius;
          return (
            <g
              key={`hover-${dim.id}`}
              transform={`translate(${center}, ${center})`}
              onMouseEnter={() => onDimensionHover(dim)}
              onMouseLeave={() => onDimensionHover(null)}
            >
              <rect
                x={x - 36}
                y={y - 10}
                width={72}
                height={20}
                fill="transparent"
                className="cursor-help"
              />
            </g>
          );
        })}
    </svg>
  );
}
