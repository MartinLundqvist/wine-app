import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { RadarChart, type RadarDimension } from "@/components/visualizations/RadarChart";
import { BarChart3 } from "lucide-react";
import type { StyleTargetFull } from "@wine-app/shared";

const RADAR_DIMENSION_IDS = [
  "acidity",
  "tannin",
  "alcohol",
  "body",
  "oak_intensity",
  "flavor_intensity",
] as const;

const SCALE_MAX: Record<string, number> = {
  acidity: 5,
  tannin: 5,
  alcohol: 3,
  body: 5,
  oak_intensity: 5,
  flavor_intensity: 5,
};

function getNormalizedValues(
  style: StyleTargetFull,
  dimensionIds: readonly string[]
): number[] {
  const structureMap = new Map(
    (style.structure ?? []).map((s) => [s.structureDimensionId, s])
  );
  return dimensionIds.map((id) => {
    const row = structureMap.get(id);
    const scaleMax = SCALE_MAX[id] ?? 5;
    if (!row || row.minValue == null || row.maxValue == null) return 0;
    const min = row?.minValue ?? 0;
    const max = row?.maxValue ?? 0;
    const mid = (min + max) / 2;
    return Math.min(1, Math.max(0, mid / scaleMax));
  });
}

export function StructureRadarPage() {
  const [primaryId, setPrimaryId] = useState<string>("");
  const [compareId, setCompareId] = useState<string>("");
  const [hoverDimension, setHoverDimension] = useState<RadarDimension | null>(null);

  const { data: styleTargets = [], isLoading: loadingStyles } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const { data: structureDimensions = [], isLoading: loadingDims } = useQuery({
    queryKey: queryKeys.structureDimensions,
    queryFn: () => api.getStructureDimensions(),
  });

  const radarDimensions = useMemo((): RadarDimension[] => {
    const dimMap = new Map(structureDimensions.map((d) => [d.id, d]));
    return RADAR_DIMENSION_IDS.map((id) => {
      const d = dimMap.get(id);
      return {
        id,
        displayName: d?.displayName ?? id.replace(/_/g, " "),
        description: d?.description ?? null,
        scaleMax: SCALE_MAX[id] ?? 5,
      };
    });
  }, [structureDimensions]);

  const primaryStyle = useMemo(
    () => styleTargets.find((s) => s.id === primaryId),
    [styleTargets, primaryId]
  );
  const compareStyle = useMemo(
    () => styleTargets.find((s) => s.id === compareId),
    [styleTargets, compareId]
  );

  const primaryValues = useMemo(
    () =>
      primaryStyle
        ? getNormalizedValues(primaryStyle, RADAR_DIMENSION_IDS)
        : [],
    [primaryStyle]
  );
  const secondaryValues = useMemo(
    () =>
      compareStyle
        ? getNormalizedValues(compareStyle, RADAR_DIMENSION_IDS)
        : undefined,
    [compareStyle]
  );

  const loading = loadingStyles || loadingDims;

  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Structure Radar"
      subtitle="Compare wine styles across six structural dimensions. Select a style and optionally overlay a second to see how they differ."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-muted-foreground font-sans">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex flex-col gap-1">
                <label htmlFor="primary-style" className="text-sm font-sans text-muted-foreground">
                  Primary style
                </label>
                <select
                  id="primary-style"
                  value={primaryId}
                  onChange={(e) => {
                    setPrimaryId(e.target.value);
                    if (e.target.value === compareId) setCompareId("");
                  }}
                  className="rounded-md border border-border bg-card px-3 py-2 font-sans text-sm text-foreground min-w-[180px]"
                >
                  <option value="">Select a style</option>
                  {styleTargets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="compare-style" className="text-sm font-sans text-muted-foreground">
                  Compare with (optional)
                </label>
                <select
                  id="compare-style"
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-2 font-sans text-sm text-foreground min-w-[180px]"
                >
                  <option value="">None</option>
                  {styleTargets
                    .filter((s) => s.id !== primaryId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {primaryId && primaryValues.length === RADAR_DIMENSION_IDS.length ? (
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-shrink-0">
                  <RadarChart
                    dimensions={radarDimensions}
                    primaryValues={primaryValues}
                    secondaryValues={secondaryValues}
                    size={320}
                    onDimensionHover={setHoverDimension}
                  />
                </div>
                {hoverDimension?.description && (
                  <div className="rounded-lg border border-border bg-card p-4 max-w-sm">
                    <p className="font-sans text-sm font-medium text-foreground mb-1">
                      {hoverDimension.displayName}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      {hoverDimension.description}
                    </p>
                  </div>
                )}
              </div>
            ) : primaryId ? (
              <p className="text-muted-foreground font-sans">
                Structure data missing for this style.
              </p>
            ) : (
              <p className="text-muted-foreground font-sans">
                Select a style to view its structure radar.
              </p>
            )}
          </>
        )}
      </div>
    </ExplorePageShell>
  );
}
