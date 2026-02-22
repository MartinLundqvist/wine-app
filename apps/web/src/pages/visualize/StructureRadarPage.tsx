import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { BarChart3 } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
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

type RadarDimensionMeta = {
  id: string;
  displayName: string;
};

export function StructureRadarPage() {
  const [primaryId, setPrimaryId] = useState<string>("");
  const [compareId, setCompareId] = useState<string>("");

  const { data: styleTargets = [], isLoading: loadingStyles } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const { data: structureDimensions = [], isLoading: loadingDims } = useQuery({
    queryKey: queryKeys.structureDimensions,
    queryFn: () => api.getStructureDimensions(),
  });

  const radarDimensions = useMemo((): RadarDimensionMeta[] => {
    const dimMap = new Map(structureDimensions.map((d) => [d.id, d]));
    return RADAR_DIMENSION_IDS.map((id) => {
      const d = dimMap.get(id);
      return {
        id,
        displayName: d?.displayName ?? id.replace(/_/g, " "),
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

  const radarData = useMemo(() => {
    if (!primaryStyle || primaryValues.length !== RADAR_DIMENSION_IDS.length) return [];
    return RADAR_DIMENSION_IDS.map((_, i) => ({
      dimension: radarDimensions[i]?.displayName ?? "",
      primary: primaryValues[i] ?? 0,
      ...(secondaryValues ? { secondary: secondaryValues[i] ?? 0 } : {}),
    }));
  }, [primaryStyle, primaryValues, radarDimensions, secondaryValues]);

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
            <motion.div
              className="flex flex-col sm:flex-row gap-6 mb-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="primary-style"
                  className="text-xs font-sans font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Primary style
                </label>
                <select
                  id="primary-style"
                  value={primaryId}
                  onChange={(e) => {
                    setPrimaryId(e.target.value);
                    if (e.target.value === compareId) setCompareId("");
                  }}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a style</option>
                  {styleTargets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="compare-style"
                  className="text-xs font-sans font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Compare with (optional)
                </label>
                <select
                  id="compare-style"
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            </motion.div>

            {primaryId && primaryValues.length === RADAR_DIMENSION_IDS.length ? (
              <>
                <motion.div
                  className="rounded-2xl border border-border bg-card p-6 md:p-10"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <ResponsiveContainer width="100%" height={420}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                          fontFamily: "var(--font-sans)",
                        }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                      <Radar
                        name={primaryStyle?.displayName ?? "Primary"}
                        dataKey="primary"
                        stroke="hsl(var(--wine-rich))"
                        fill="hsl(var(--wine-rich))"
                        fillOpacity={compareStyle ? 0.25 : 0.35}
                        strokeWidth={2}
                      />
                      {compareStyle && (
                        <Radar
                          name={compareStyle.displayName}
                          dataKey="secondary"
                          stroke="hsl(var(--oak))"
                          fill="hsl(var(--oak))"
                          fillOpacity={0.2}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      )}
                      <Legend
                        wrapperStyle={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 13,
                          paddingTop: 16,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                      {primaryStyle?.displayName}
                    </h3>
                    <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                      {primaryStyle?.context?.notes ?? "No tasting notes available for this style yet."}
                    </p>
                  </div>
                  {compareStyle && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                        {compareStyle.displayName}
                      </h3>
                      <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                        {compareStyle.context?.notes ?? "No tasting notes available for this style yet."}
                      </p>
                    </div>
                  )}
                </motion.div>
              </>
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
