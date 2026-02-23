import { useMemo, useState, useCallback } from "react";
import { scaleLinear } from "d3-scale";
import type { WineStyleFull } from "@wine-app/shared";
import { getOrdinalLabel } from "@wine-app/shared";
import { StyleMarker } from "./StyleMarker";
import { Tooltip } from "./Tooltip";

function getStruct(
  style: WineStyleFull,
  dimId: string
): number | null {
  const row = (style.structure ?? []).find(
    (s) => s.structureDimensionId === dimId
  );
  if (!row) return null;
  const min = row.minValue ?? 0;
  const max = row.maxValue ?? 0;
  return (min + max) / 2;
}

/** X = body (1-5), Y = overall_intensity (1-5) */
function getPoint(
  style: WineStyleFull
): { x: number; y: number } | null {
  const body = getStruct(style, "body");
  const intensity = getStruct(style, "overall_intensity");
  if (body == null || intensity == null) return null;
  const scaleMax = 5;
  return {
    x: Math.max(0, Math.min(1, body / scaleMax)),
    y: Math.max(0, Math.min(1, intensity / scaleMax)),
  };
}

type FlavorMapProps = {
  styles: WineStyleFull[];
  isRed: boolean;
  climateFilter: string | null;
  width?: number;
  height?: number;
};

export function FlavorMap({
  styles,
  isRed,
  climateFilter,
  width = 500,
  height = 400,
}: FlavorMapProps) {
  const [hoverStyle, setHoverStyle] = useState<WineStyleFull | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filtered = useMemo(() => {
    let list = styles.filter(
      (s) => s.producedColor === (isRed ? "red" : "white")
    );
    if (climateFilter) {
      list = list.filter((s) => {
        const labels = s.climateOrdinalScale?.labels;
        if (s.climateMin == null || !labels?.length) return false;
        const label = getOrdinalLabel(labels, s.climateMin);
        return label === climateFilter;
      });
    }
    return list;
  }, [styles, isRed, climateFilter]);

  const pointsWithRaw = useMemo(() => {
    return filtered
      .map((style) => {
        const pt = getPoint(style);
        if (!pt) return null;
        return { style, x: pt.x, y: pt.y };
      })
      .filter(
        (p): p is { style: WineStyleFull; x: number; y: number } => p !== null
      );
  }, [filtered]);

  const margin = { top: 24, right: 24, bottom: 40, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () => scaleLinear().domain([0, 1]).range([0, innerWidth]).clamp(true),
    [innerWidth]
  );
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0])
        .clamp(true),
    [innerHeight]
  );

  const points = useMemo(
    () =>
      pointsWithRaw.map(({ style, x, y }) => ({
        style,
        x: margin.left + xScale(x),
        y: margin.top + yScale(y),
      })),
    [pointsWithRaw, xScale, yScale, margin.left, margin.top]
  );

  const handleMouseEnter = useCallback(
    (style: WineStyleFull, clientX: number, clientY: number) => {
      setHoverStyle(style);
      setTooltipPos({ x: clientX, y: clientY });
    },
    []
  );
  const handleMouseLeave = useCallback(() => setHoverStyle(null), []);

  const aromasText =
    hoverStyle?.aromaDescriptors
      ?.filter((a) => a.descriptor?.displayName)
      .slice(0, 5)
      .map((a) => a.descriptor!.displayName)
      .join(", ") ?? "";
  const structureText =
    hoverStyle?.structure
      ?.filter((s) =>
        ["acidity", "tannins", "body"].includes(s.structureDimensionId)
      )
      .map((s) => {
        const d = s.dimension;
        const v =
          s.minValue != null
            ? (s.minValue + (s.maxValue ?? s.minValue)) / 2
            : null;
        return v != null && d ? `${d.displayName}: ${v}` : null;
      })
      .filter(Boolean)
      .join(" · ") ?? "";

  return (
    <>
      <div className="relative rounded-xl border border-border bg-cream overflow-hidden">
        <svg width={width} height={height} className="font-serif">
          <defs>
            <pattern
              id="grid"
              width={innerWidth / 5}
              height={innerHeight / 5}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${innerWidth / 5} 0 L 0 0 0 ${innerHeight / 5}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                opacity={0.6}
              />
            </pattern>
          </defs>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="url(#grid)"
            />
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          </g>
          {points.map(({ style, x, y }) => (
            <g
              key={style.id}
              onMouseEnter={(e) =>
                handleMouseEnter(style, e.clientX, e.clientY)
              }
              onMouseLeave={handleMouseLeave}
            >
              <StyleMarker
                x={x}
                y={y}
                to={`/explore/styles/${style.id}`}
                aria-label={style.displayName}
              />
            </g>
          ))}
          <text
            x={margin.left + innerWidth / 2}
            y={margin.top + innerHeight + 24}
            textAnchor="middle"
            className="fill-foreground text-xs font-serif"
          >
            Body: Light ← → Full
          </text>
          <text
            x={margin.left - 12}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            className="fill-foreground text-xs font-serif"
            transform={`rotate(-90, ${margin.left - 12}, ${margin.top + innerHeight / 2})`}
          >
            Intensity: Low ← → High
          </text>
        </svg>
      </div>

      <Tooltip visible={!!hoverStyle} x={tooltipPos.x} y={tooltipPos.y}>
        {hoverStyle && (
          <div className="font-sans text-sm">
            <p className="font-semibold text-foreground">
              {hoverStyle.displayName}
            </p>
            {aromasText && (
              <p className="text-muted-foreground mt-1">{aromasText}</p>
            )}
            {structureText && (
              <p className="text-muted-foreground mt-0.5 text-xs">
                {structureText}
              </p>
            )}
          </div>
        )}
      </Tooltip>
    </>
  );
}
