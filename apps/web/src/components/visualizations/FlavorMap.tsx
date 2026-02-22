import { useMemo, useState, useCallback } from "react";
import { scaleLinear } from "d3-scale";
import type { StyleTargetFull } from "@wine-app/shared";
import { StyleMarker } from "./StyleMarker";
import { Tooltip } from "./Tooltip";

const FRUIT_PROFILE_RED: Record<string, number> = { Red: 0, Black: 1 };
const FRUIT_PROFILE_WHITE: Record<string, number> = {
  Citrus: 0,
  Orchard: 0.5,
  Tropical: 1,
};

function getStruct(
  style: StyleTargetFull,
  dimId: string
): { mid: number; cat?: string } | null {
  const row = (style.structure ?? []).find((s) => s.structureDimensionId === dimId);
  if (!row) return null;
  if (row.categoricalValue) return { mid: 0, cat: row.categoricalValue };
  const min = row.minValue ?? 0;
  const max = row.maxValue ?? 0;
  return { mid: (min + max) / 2 };
}

function getPoint(
  style: StyleTargetFull,
  isRed: boolean
): { x: number; yRaw: number } | null {
  const fruit = getStruct(style, "fruit_profile");
  const herbal = getStruct(style, "herbal_character");
  const earth = getStruct(style, "earth_spice_character");
  const flavor = getStruct(style, "flavor_intensity");
  if (!fruit || !herbal || !earth || !flavor) return null;
  const map = isRed ? FRUIT_PROFILE_RED : FRUIT_PROFILE_WHITE;
  const xCat = fruit.cat ? map[fruit.cat] : 0;
  const herbalMid = herbal.mid;
  const earthMid = earth.mid;
  const flavorMid = flavor.mid;
  const jitter = (herbalMid - 3) * 0.05;
  const x = Math.max(0, Math.min(1, xCat + jitter));
  const sumEH = earthMid + herbalMid;
  const denom = flavorMid + sumEH;
  const yRaw = denom > 0 ? sumEH / denom : 0;
  return { x, yRaw };
}

type FlavorMapProps = {
  styles: StyleTargetFull[];
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
  const [hoverStyle, setHoverStyle] = useState<StyleTargetFull | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filtered = useMemo(() => {
    let list = styles.filter((s) => s.producedColor === (isRed ? "red" : "white"));
    if (climateFilter) {
      list = list.filter(
        (s) => s.context?.thermalBandId === climateFilter
      );
    }
    return list;
  }, [styles, isRed, climateFilter]);

  const pointsWithRaw = useMemo(() => {
    return filtered
      .map((style) => {
        const pt = getPoint(style, isRed);
        if (!pt) return null;
        return { style, x: pt.x, yRaw: pt.yRaw };
      })
      .filter((p): p is { style: StyleTargetFull; x: number; yRaw: number } => p !== null);
  }, [filtered, isRed]);

  const yMin = useMemo(
    () => (pointsWithRaw.length ? Math.min(...pointsWithRaw.map((p) => p.yRaw)) : 0),
    [pointsWithRaw]
  );
  const yMax = useMemo(
    () => (pointsWithRaw.length ? Math.max(...pointsWithRaw.map((p) => p.yRaw)) : 1),
    [pointsWithRaw]
  );
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
        .domain([yMin, yMax])
        .range([innerHeight, 0])
        .clamp(true),
    [innerHeight, yMin, yMax]
  );

  const points = useMemo(
    () =>
      pointsWithRaw.map(({ style, x, yRaw }) => ({
        style,
        x: margin.left + xScale(x),
        y: margin.top + yScale(yRaw),
      })),
    [pointsWithRaw, xScale, yScale, margin.left, margin.top]
  );

  const handleMouseEnter = useCallback(
    (style: StyleTargetFull, clientX: number, clientY: number) => {
      setHoverStyle(style);
      setTooltipPos({ x: clientX, y: clientY });
    },
    []
  );
  const handleMouseLeave = useCallback(() => setHoverStyle(null), []);

  const aromasText = hoverStyle?.aromas
    ?.filter((a) => a.term?.displayName)
    .slice(0, 5)
    .map((a) => a.term!.displayName)
    .join(", ") ?? "";
  const structureText = hoverStyle?.structure
    ?.filter(
      (s) =>
        ["acidity", "tannin", "body"].includes(s.structureDimensionId)
    )
    .map((s) => {
      const d = s.dimension;
      const v = s.minValue != null ? (s.minValue + (s.maxValue ?? s.minValue)) / 2 : null;
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
              onMouseEnter={(e) => handleMouseEnter(style, e.clientX, e.clientY)}
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
            {isRed ? "Red fruit ← → Black fruit" : "Citrus ← → Orchard ← → Tropical"}
          </text>
          <text
            x={margin.left - 12}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            className="fill-foreground text-xs font-serif"
            transform={`rotate(-90, ${margin.left - 12}, ${margin.top + innerHeight / 2})`}
          >
            Fruit-driven ← → Earth / herb
          </text>
        </svg>
      </div>

      <Tooltip visible={!!hoverStyle} x={tooltipPos.x} y={tooltipPos.y}>
        {hoverStyle && (
          <div className="font-sans text-sm">
            <p className="font-semibold text-foreground">{hoverStyle.displayName}</p>
            {aromasText && (
              <p className="text-muted-foreground mt-1">{aromasText}</p>
            )}
            {structureText && (
              <p className="text-muted-foreground mt-0.5 text-xs">{structureText}</p>
            )}
          </div>
        )}
      </Tooltip>
    </>
  );
}
