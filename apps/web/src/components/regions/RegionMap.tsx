import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { Region } from "@wine-app/shared";
import {
  COUNTRY_TO_ISO_NUMERIC,
  getWineCountryNames,
} from "./countryCodes";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
    <div className="relative w-full rounded-lg overflow-hidden bg-background border border-border">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 140,
          center: [10, 30],
        }}
        className="w-full aspect-[16/10]"
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
                  ? "#741A2F"
                  : isHovered
                    ? "#571325"
                    : "#3B0F1D"
                : "#332822";
              const stroke = isWine
                ? isSelected || isHovered
                  ? "#B08A3C"
                  : "#8A735E"
                : "#8A735E40";
              const strokeWidth =
                isWine && (isSelected || isHovered) ? 1.5 : 0.5;
              const hoverFill = isWine ? "#571325" : "#332822";
              const hoverStroke = isWine ? "#B08A3C" : "#8A735E40";
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
      {tooltip && (
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
    </div>
  );
}
