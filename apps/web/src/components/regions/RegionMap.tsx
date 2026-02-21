import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { Region } from "@wine-app/shared";
import {
  COUNTRY_TO_ISO_NUMERIC,
  getWineCountryNames,
} from "./countryCodes";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** Map colors aligned with design tokens (index.css). */
const MAP_COLORS = {
  cellar: "hsl(0 10% 12%)",
  wineDeep: "hsl(348 70% 20%)",
  wineRich: "hsl(348 60% 28%)",
  wineLight: "hsl(348 40% 45%)",
  oakLight: "hsl(30 35% 55%)",
  borderSubtle: "hsl(0 0% 20% / 0.25)",
  borderWine: "hsl(28 50% 35% / 0.6)",
} as const;

type RegionMapProps = {
  regions: Region[];
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
};

export function RegionMap({
  regions,
  selectedCountry,
  onSelectCountry,
}: RegionMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; count: number } | null>(
    null,
  );

  const { countryToRegionCount, numericIds } = useMemo(() => {
    const countries = [...new Set(regions.map((r) => r.country))];
    const wineCountryNames = getWineCountryNames(countries);
    const numericIds = new Set(
      wineCountryNames
        .map((name) => COUNTRY_TO_ISO_NUMERIC[name])
        .filter((id): id is number => id != null),
    );
    const countryToRegionCount = new Map<string, number>();
    for (const r of regions) {
      if (r.parentRegionId == null) continue;
      const parent = regions.find((p) => p.id === r.parentRegionId);
      if (parent) {
        const c = parent.country;
        countryToRegionCount.set(c, (countryToRegionCount.get(c) ?? 0) + 1);
      }
    }
    for (const c of wineCountryNames) {
      if (!countryToRegionCount.has(c)) {
        countryToRegionCount.set(c, 0);
      }
    }
    return { countryToRegionCount, numericIds };
  }, [regions]);

  const numericToName = useMemo(() => {
    const map = new Map<number, string>();
    for (const [name, id] of Object.entries(COUNTRY_TO_ISO_NUMERIC)) {
      map.set(id, name);
    }
    return map;
  }, []);

  const handleMouseEnter = (geo: { id?: string | number; name?: string }) => {
    const id = geo.id != null ? Number(geo.id) : undefined;
    const name = id != null ? numericToName.get(id) : geo.name ?? null;
    if (name && numericIds.has(id as number)) {
      setHoveredCountry(name);
      setTooltip({
        name,
        count: countryToRegionCount.get(name) ?? 0,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
    setTooltip(null);
  };

  const handleClick = (geo: { id?: string | number; name?: string }) => {
    const id = geo.id != null ? Number(geo.id) : undefined;
    const name = id != null ? numericToName.get(id) : geo.name ?? null;
    if (name && numericIds.has(id as number)) {
      onSelectCountry(selectedCountry === name ? null : name);
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-background border-0">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [10, 30],
        }}
        className="w-full h-full"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const numericId =
                typeof geo.id === "string" ? parseInt(geo.id, 10) : geo.id;
              const isWine = numericId != null && numericIds.has(numericId);
              const name = numericToName.get(numericId as number);
              const isSelected = name != null && selectedCountry === name;
              const isHovered = name != null && hoveredCountry === name;

              const fill = isWine
                ? isSelected
                  ? MAP_COLORS.wineLight
                  : isHovered
                    ? MAP_COLORS.wineRich
                    : MAP_COLORS.wineDeep
                : MAP_COLORS.cellar;
              const stroke = isWine
                ? isSelected || isHovered
                  ? MAP_COLORS.oakLight
                  : MAP_COLORS.borderWine
                : MAP_COLORS.borderSubtle;
              const strokeWidth =
                isWine && (isSelected || isHovered) ? 1.5 : 0.5;
              const hoverFill = isWine ? MAP_COLORS.wineRich : MAP_COLORS.cellar;
              const hoverStroke = isWine
                ? MAP_COLORS.oakLight
                : MAP_COLORS.borderSubtle;
              const hoverStrokeWidth = isWine ? 1.5 : 0.5;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => handleMouseEnter(geo)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(geo)}
                  style={{
                    default: {
                      fill,
                      stroke,
                      strokeWidth,
                      outline: "none",
                      transition: "fill 120ms, stroke 120ms",
                    },
                    hover: {
                      fill: hoverFill,
                      stroke: hoverStroke,
                      strokeWidth: hoverStrokeWidth,
                      outline: "none",
                      cursor: isWine ? "pointer" : "default",
                    },
                    pressed: {
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {/* Hover tooltip (pointer devices) */}
      {tooltip && !selectedCountry && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-md bg-oak border border-border text-foreground text-sm font-sans pointer-events-none z-10"
          role="tooltip"
        >
          {tooltip.name}
          {tooltip.count > 0 && (
            <span className="text-muted-foreground ml-1">
              · {tooltip.count} region{tooltip.count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Selected country label (touch-friendly; always visible when a country is selected) */}
      {selectedCountry && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm font-sans shadow-soft z-10"
          role="status"
          aria-live="polite"
        >
          {selectedCountry}
          {(countryToRegionCount.get(selectedCountry) ?? 0) > 0 && (
            <span className="text-muted-foreground ml-1">
              · {countryToRegionCount.get(selectedCountry)} region
              {(countryToRegionCount.get(selectedCountry) ?? 0) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
