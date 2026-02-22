import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StyleTargetFull } from "@wine-app/shared";
import { RadarChart, type RadarDimension } from "./RadarChart";

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

const AGING_CURVES = {
  young: {
    fruitIntensity: 1.0,
    earthSpice: 1.0,
    tannin: 1.0,
    acidity: 1.0,
    oakIntensity: 1.0,
    alcohol: 1.0,
    body: 1.0,
  },
  developing: {
    fruitIntensity: 0.85,
    earthSpice: 1.3,
    tannin: 0.85,
    acidity: 0.95,
    oakIntensity: 0.9,
    alcohol: 1.0,
    body: 0.95,
  },
  mature: {
    fruitIntensity: 0.6,
    earthSpice: 1.7,
    tannin: 0.65,
    acidity: 0.9,
    oakIntensity: 0.75,
    alcohol: 1.0,
    body: 0.9,
  },
} as const;

type AgingStage = keyof typeof AGING_CURVES;

const STAGE_LABELS: Record<AgingStage, string> = {
  young: "Young",
  developing: "Developing",
  mature: "Mature",
};

function getBaseValues(style: StyleTargetFull): number[] {
  const structureMap = new Map(
    (style.structure ?? []).map((s) => [s.structureDimensionId, s])
  );
  return RADAR_DIMENSION_IDS.map((id) => {
    const row = structureMap.get(id);
    const scaleMax = SCALE_MAX[id] ?? 5;
    if (!row || row.minValue == null || row.maxValue == null) return 0;
    const min = row?.minValue ?? 0;
    const max = row?.maxValue ?? min;
    const mid = (min + max) / 2;
    return Math.min(1, Math.max(0, mid / scaleMax));
  });
}

function applyAgingCurve(
  baseValues: number[],
  stage: AgingStage
): number[] {
  const curve = AGING_CURVES[stage];
  const dimMap: Record<string, keyof typeof curve> = {
    acidity: "acidity",
    tannin: "tannin",
    alcohol: "alcohol",
    body: "body",
    oak_intensity: "oakIntensity",
    flavor_intensity: "fruitIntensity",
  };
  return RADAR_DIMENSION_IDS.map((id, i) => {
    const base = baseValues[i] ?? 0;
    const mult = curve[dimMap[id] ?? "fruitIntensity"] ?? 1;
    return Math.min(1, Math.max(0, base * mult));
  });
}

type AgingTimelineProps = {
  style: StyleTargetFull | null;
  mode: "structure" | "aroma" | "both";
  structureDimensions: { id: string; displayName: string; description?: string | null; scaleMax?: number | null }[];
};

export function AgingTimeline({
  style,
  mode,
  structureDimensions,
}: AgingTimelineProps) {
  const [stage, setStage] = useState<AgingStage>("young");

  const radarDimensions: RadarDimension[] = RADAR_DIMENSION_IDS.map((id) => {
    const d = structureDimensions.find((dim) => dim.id === id);
    return {
      id,
      displayName: d?.displayName ?? id.replace(/_/g, " "),
      description: d?.description ?? null,
      scaleMax: SCALE_MAX[id] ?? 5,
    };
  });

  const baseValues = useMemo(
    () => (style ? getBaseValues(style) : []),
    [style]
  );
  const agedValues = useMemo(
    () => (baseValues.length ? applyAgingCurve(baseValues, stage) : []),
    [baseValues, stage]
  );

  const showRadar = (mode === "structure" || mode === "both") && style;
  const showAroma = (mode === "aroma" || mode === "both") && style;

  const primaryAromas = useMemo(() => {
    if (!style?.aromas) return [];
    return style.aromas
      .filter((a) => a.term?.source === "primary" || !a.term?.source)
      .map((a) => a.term?.displayName ?? a.aromaTermId)
      .filter(Boolean) as string[];
  }, [style]);
  const tertiaryAromas = useMemo(() => {
    const raw = style?.context?.commonTertiaryAromas;
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [style]);

  const hueDim = style?.structure?.find(
    (s) =>
      s.structureDimensionId === "color_hue_red" ||
      s.structureDimensionId === "color_hue_white"
  );
  const hueValue = hueDim?.minValue ?? hueDim?.maxValue;
  const showColorIndicator = hueValue != null && (mode === "structure" || mode === "both");

  if (!style) {
    return (
      <p className="text-muted-foreground font-sans">Select a style to view aging.</p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {showRadar && baseValues.length === RADAR_DIMENSION_IDS.length && (
        <motion.div
          key={stage}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <RadarChart
            dimensions={radarDimensions}
            primaryValues={agedValues}
            size={280}
          />
          {showColorIndicator && (
            <div
              className="w-6 h-6 rounded-full border-2 border-border"
              style={{
                background: `hsl(${20 + (hueValue - 1) * 15}, 50%, 40%)`,
              }}
              title="Color hue shift"
              aria-hidden
            />
          )}
        </motion.div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-sans text-muted-foreground">
          Aging stage
        </label>
        <input
          type="range"
          min={0}
          max={2}
          value={stage === "young" ? 0 : stage === "developing" ? 1 : 2}
          onChange={(e) => {
            const v = Number(e.target.value);
            setStage(v === 0 ? "young" : v === 1 ? "developing" : "mature");
          }}
          className="w-full accent-primary"
          aria-label="Aging stage"
        />
        <div className="flex justify-between text-xs font-sans text-muted-foreground">
          <span>{STAGE_LABELS.young}</span>
          <span>{STAGE_LABELS.developing}</span>
          <span>{STAGE_LABELS.mature}</span>
        </div>
      </div>

      {showAroma && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-sans text-muted-foreground mb-2">
            Aromas by stage (primary fade, tertiary emerge)
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {stage === "young" &&
                primaryAromas.map((a) => (
                  <motion.span
                    key={a}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-sans text-foreground"
                  >
                    {a}
                  </motion.span>
                ))}
              {stage === "mature" &&
                tertiaryAromas.map((a) => (
                  <motion.span
                    key={a}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-full border border-oak bg-oak/10 px-2 py-0.5 text-xs font-sans text-foreground"
                  >
                    {a}
                  </motion.span>
                ))}
              {stage === "developing" &&
                [...primaryAromas.slice(0, 2), ...tertiaryAromas.slice(0, 2)].map((a) => (
                  <motion.span
                    key={a}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-full border border-border bg-card/80 px-2 py-0.5 text-xs font-sans text-foreground"
                  >
                    {a}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
