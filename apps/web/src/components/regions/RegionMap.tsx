import { useMemo, useState, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { Region, RegionsMapConfigResponse } from "@wine-app/shared";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WORLD_VIEW = { center: [10, 30] as [number, number], zoom: 1 };

/** Map colors aligned with design tokens (index.css). */
const MAP_COLORS = {
  cellar: "hsl(0 10% 12%)",
  wineDeep: "hsl(348 70% 20%)",
  wineRich: "hsl(348 60% 28%)",
  wineLight: "hsl(348 40% 45%)",
  oakLight: "hsl(30 35% 55%)",
  borderSubtle: "hsl(0 0% 20% / 0.25)",
  borderWine: "hsl(28 50% 35% / 0.6)",
  nonWineDimmed: "hsl(0 10% 12% / 0.4)",
} as const;

type RegionMapProps = {
  regions: Region[];
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
  hoveredSubRegionId: string | null;
  mapConfig?: RegionsMapConfigResponse | null;
};

export function RegionMap({
  regions,
  selectedCountry,
  onSelectCountry,
  hoveredSubRegionId,
  mapConfig,
}: RegionMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; count: number } | null>(
    null,
  );
  const [admin1Geo, setAdmin1Geo] = useState<object | null>(null);
  const [admin1LoadError, setAdmin1LoadError] = useState(false);
  const [hoveredAdmin1Name, setHoveredAdmin1Name] = useState<string | null>(null);
  const geoCacheRef = useRef<Record<string, object>>({});

  const useApiConfig = mapConfig != null && mapConfig.countries.length > 0;

  const { countryToRegionCount, numericIds } = useMemo(() => {
    const regionToCountry = new Map<string, string>();
    for (const r of regions) {
      const country = r.regionLevel === "country" && !r.parentId
        ? r.displayName
        : (() => {
            let cur: Region | undefined = r;
            const seen = new Set<string>();
            while (cur?.parentId && !seen.has(cur.parentId)) {
              seen.add(cur.parentId);
              cur = regions.find((p) => p.id === cur!.parentId);
            }
            return cur?.regionLevel === "country" ? cur.displayName : null;
          })();
      if (country) regionToCountry.set(r.id, country);
    }
    const countries = [...new Set(regionToCountry.values())];
    const wineCountryNames = useApiConfig
      ? countries.filter((c) =>
          mapConfig!.countries.some((cfg) => cfg.countryName === c)
        )
      : countries.filter((c) => c !== "International");
    const numericIds = useApiConfig
      ? new Set(mapConfig!.countries.map((c) => c.isoNumeric))
      : new Set<number>();
    const countryToRegionCount = new Map<string, number>();
    for (const r of regions) {
      if (r.parentId == null) continue;
      const c = regionToCountry.get(r.id);
      if (c) countryToRegionCount.set(c, (countryToRegionCount.get(c) ?? 0) + 1);
    }
    for (const c of wineCountryNames) {
      if (!countryToRegionCount.has(c)) {
        countryToRegionCount.set(c, 0);
      }
    }
    return { countryToRegionCount, numericIds };
  }, [regions, useApiConfig, mapConfig]);

  const numericToName = useMemo(() => {
    const map = new Map<number, string>();
    if (useApiConfig && mapConfig) {
      for (const c of mapConfig.countries) {
        map.set(c.isoNumeric, c.countryName);
      }
    }
    return map;
  }, [useApiConfig, mapConfig]);

  const zoomConfigByCountry = useMemo(() => {
    const m = new Map<string, { center: [number, number]; zoom: number }>();
    if (useApiConfig && mapConfig) {
      for (const c of mapConfig.countries) {
        m.set(c.countryName, {
          center: [c.zoomCenterLon, c.zoomCenterLat],
          zoom: c.zoomLevel,
        });
      }
    }
    return m;
  }, [useApiConfig, mapConfig]);

  const { center: zoomCenter, zoom: zoomLevel } = useMemo(() => {
    if (!selectedCountry) return WORLD_VIEW;
    const config = zoomConfigByCountry.get(selectedCountry);
    if (!config) return WORLD_VIEW;
    return { center: config.center, zoom: config.zoom };
  }, [selectedCountry, zoomConfigByCountry]);

  const geoSlugByCountry = useMemo(() => {
    const m = new Map<string, string>();
    if (useApiConfig && mapConfig) {
      for (const c of mapConfig.countries) {
        m.set(c.countryName, c.geoSlug);
      }
    }
    return m;
  }, [useApiConfig, mapConfig]);

  useEffect(() => {
    if (!selectedCountry) {
      setAdmin1Geo(null);
      setAdmin1LoadError(false);
      return;
    }
    const slug = geoSlugByCountry.get(selectedCountry);
    if (!slug) {
      setAdmin1Geo(null);
      return;
    }
    const cached = geoCacheRef.current[slug];
    if (cached) {
      setAdmin1Geo(cached);
      setAdmin1LoadError(false);
      return;
    }
    setAdmin1LoadError(false);
    fetch(`/geo/${slug}-admin1.json`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((topo) => {
        geoCacheRef.current[slug] = topo;
        setAdmin1Geo(topo);
        setAdmin1LoadError(false);
        if (import.meta.env.DEV && topo?.objects?.regions?.geometries) {
          const names = new Set(
            topo.objects.regions.geometries.map(
              (g: { properties?: { name?: string } }) => g.properties?.name,
            ),
          );
          const subRegions = regions.filter(
            (r) =>
              r.parentId &&
              (() => {
                const root = regions.find(
                  (p) =>
                    p.regionLevel === "country" &&
                    !p.parentId &&
                    p.displayName === selectedCountry
                );
                return root ? r.parentId === root.id : false;
              })(),
          );
          const subRegionToAdmin1 = useApiConfig && mapConfig
            ? mapConfig.boundaryMappings
            : {};
          for (const sub of subRegions) {
            const admin1Names = subRegionToAdmin1[sub.id] ?? [];
            if (!admin1Names.length) {
              console.warn(
                `[Regions] No admin-1 mapping for sub-region "${sub.id}". Add boundary mapping in DB.`,
              );
              continue;
            }
            const missing = admin1Names.filter((n) => !names.has(n));
            if (missing.length > 0) {
              console.warn(
                `[Regions] Sub-region "${sub.id}" maps to admin-1 names not found in TopoJSON:`,
                missing,
                "Available names (sample):",
                [...names].slice(0, 10),
              );
            }
          }
        }
      })
      .catch(() => {
        setAdmin1LoadError(true);
        setAdmin1Geo(null);
      });
  }, [selectedCountry, regions, useApiConfig, mapConfig, geoSlugByCountry]);

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

  const admin1NameToRegionIds = useMemo(() => {
    const map = new Map<string, string[]>();
    const source = useApiConfig && mapConfig ? mapConfig.boundaryMappings : {};
    for (const [regionId, names] of Object.entries(source)) {
      for (const n of names) {
        const list = map.get(n) ?? [];
        list.push(regionId);
        map.set(n, list);
      }
    }
    return map;
  }, [useApiConfig, mapConfig]);

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
        <ZoomableGroup
          center={zoomCenter}
          zoom={zoomLevel}
          minZoom={1}
          maxZoom={8}
          filterZoomEvent={() => false}
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
                const hoverFill = isWine
                  ? MAP_COLORS.wineRich
                  : MAP_COLORS.cellar;
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

          {selectedCountry && admin1Geo && (
            <Geographies geography={admin1Geo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name =
                    (geo.properties && "name" in geo.properties
                      ? geo.properties.name
                      : null) as string | null;
                  const regionIds =
                    (name ? admin1NameToRegionIds.get(name) : undefined) ?? [];
                  const isWineRegion = regionIds.length > 0;
                  const isPanelHover =
                    hoveredSubRegionId != null &&
                    regionIds.includes(hoveredSubRegionId);
                  const isMapHover = name !== null && hoveredAdmin1Name === name;
                  const priorityFill = isPanelHover
                    ? MAP_COLORS.wineLight
                    : isMapHover && isWineRegion
                      ? MAP_COLORS.wineLight
                      : isWineRegion
                        ? MAP_COLORS.wineDeep
                        : MAP_COLORS.nonWineDimmed;
                  const priorityStroke =
                    isPanelHover || (isMapHover && isWineRegion)
                      ? MAP_COLORS.oakLight
                      : isWineRegion
                        ? MAP_COLORS.borderWine
                        : MAP_COLORS.borderSubtle;
                  const strokeWidth =
                    isPanelHover || (isMapHover && isWineRegion) ? 1.5 : 0.5;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => name && setHoveredAdmin1Name(name)}
                      onMouseLeave={() => setHoveredAdmin1Name(null)}
                      style={{
                        default: {
                          fill: priorityFill,
                          stroke: priorityStroke,
                          strokeWidth,
                          outline: "none",
                          transition: "fill 120ms, stroke 120ms",
                        },
                        hover: {
                          fill:
                            isWineRegion || isPanelHover
                              ? MAP_COLORS.wineLight
                              : MAP_COLORS.nonWineDimmed,
                          stroke: MAP_COLORS.oakLight,
                          strokeWidth: 1.5,
                          outline: "none",
                          cursor: isWineRegion ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {selectedCountry && (
        <button
          type="button"
          onClick={() => onSelectCountry(null)}
          className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-card/95 backdrop-blur-sm border border-border text-foreground text-sm font-sans shadow-soft hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
          aria-label="Back to world map"
        >
          Back to world
        </button>
      )}

      {admin1LoadError && selectedCountry && (
        <div
          className="absolute top-4 right-4 z-20 px-3 py-2 rounded-lg bg-card/95 backdrop-blur-sm border border-border text-muted-foreground text-sm font-sans shadow-soft"
          role="status"
        >
          Regional boundaries unavailable
        </div>
      )}

      {tooltip && !selectedCountry && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-card/95 backdrop-blur-sm border border-border text-foreground text-sm font-sans shadow-soft pointer-events-none z-10"
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

      {selectedCountry && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-card/95 backdrop-blur-sm border border-border text-foreground text-sm font-sans shadow-soft z-10"
          role="status"
          aria-live="polite"
        >
          {selectedCountry}
          {(countryToRegionCount.get(selectedCountry) ?? 0) > 0 && (
            <span className="text-muted-foreground ml-1">
              · {countryToRegionCount.get(selectedCountry)} region
              {(countryToRegionCount.get(selectedCountry) ?? 0) !== 1
                ? "s"
                : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
