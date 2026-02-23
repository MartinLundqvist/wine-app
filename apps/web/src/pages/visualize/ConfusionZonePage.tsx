import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { RadarChart, type RadarDimension } from "@/components/visualizations/RadarChart";
import { Chip } from "@/components/ui/Chip";
import { BarChart3 } from "lucide-react";
import type { WineStyleFull } from "@wine-app/shared";
import type { ConfusionDifficulty, ConfusionDistractor } from "@wine-app/shared";

const RADAR_DIMENSION_IDS = [
  "acidity",
  "tannins",
  "alcohol",
  "body",
  "oak_influence",
  "overall_intensity",
] as const;
const SCALE_MAX = 5;

function getNormalizedValues(style: WineStyleFull): number[] {
  const structureMap = new Map(
    (style.structure ?? []).map((s) => [s.structureDimensionId, s])
  );
  return RADAR_DIMENSION_IDS.map((id) => {
    const row = structureMap.get(id);
    if (!row || row.minValue == null || row.maxValue == null) return 0;
    const min = row.minValue ?? 0;
    const max = row.maxValue ?? min;
    const mid = (min + max) / 2;
    return Math.min(1, Math.max(0, mid / SCALE_MAX));
  });
}

const ROLE_LABEL: Record<ConfusionDistractor["role"], string> = {
  evil_twin: "Evil Twin",
  structural_match: "Structural Match",
  directional_match: "Directional Match",
};

export function ConfusionZonePage() {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<ConfusionDifficulty>("medium");

  const { data: styleTargets = [], isLoading: loadingStyles } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const { data: structureDimensions = [] } = useQuery({
    queryKey: queryKeys.structureDimensions,
    queryFn: () => api.getStructureDimensions(),
  });

  const { data: confusionGroup, isLoading: loadingConfusion } = useQuery({
    queryKey: queryKeys.confusionGroup(selectedTargetId ?? "", difficulty),
    queryFn: () => api.getConfusionGroup(selectedTargetId!, difficulty),
    enabled: !!selectedTargetId,
  });

  const radarDimensions: RadarDimension[] = RADAR_DIMENSION_IDS.map((id) => {
    const d = structureDimensions.find((dim) => dim.id === id);
    return {
      id,
      displayName: d?.displayName ?? id.replace(/_/g, " "),
      description: d?.description ?? null,
      scaleMax: SCALE_MAX,
    };
  });

  const targetStyle = selectedTargetId
    ? styleTargets.find((s) => s.id === selectedTargetId)
    : null;
  const targetValues = targetStyle ? getNormalizedValues(targetStyle) : [];

  if (loadingStyles) {
    return (
      <ExplorePageShell
        sectionLabel="Visualize"
        title="Confusion Zone"
        subtitle="Discover which styles are most easily confused."
        icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
      >
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-muted-foreground font-sans">Loading…</p>
        </div>
      </ExplorePageShell>
    );
  }

  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Confusion Zone"
      subtitle="Discover which styles are most easily confused with each other and learn how to tell them apart."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        {!selectedTargetId ? (
          <>
            <p className="text-muted-foreground font-sans mb-6">
              Pick a style to see its confusion group (similar styles that are often mixed up).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {styleTargets.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedTargetId(style.id)}
                  className="rounded-xl border border-border bg-card p-4 text-left shadow-soft hover:shadow-wine hover:border-primary/30 transition-all font-sans"
                >
                  <span className="font-semibold text-foreground">{style.displayName}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSelectedTargetId(null)}
                className="text-sm text-muted-foreground hover:text-foreground font-sans"
              >
                ← Back to style picker
              </button>
              <span className="text-sm font-sans text-muted-foreground">Difficulty:</span>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <Chip
                  key={d}
                  variant={difficulty === d ? "selected" : "base"}
                  onClick={() => setDifficulty(d)}
                  className="cursor-pointer"
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Chip>
              ))}
            </div>

            {loadingConfusion ? (
              <p className="text-muted-foreground font-sans">Loading confusion group…</p>
            ) : !confusionGroup ? (
              <p className="text-muted-foreground font-sans">Failed to load.</p>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-2">
                    Target style
                  </h2>
                  <div className="flex items-center gap-4">
                    {targetStyle && targetValues.length === RADAR_DIMENSION_IDS.length && (
                      <RadarChart
                        dimensions={radarDimensions}
                        primaryValues={targetValues}
                        size={200}
                      />
                    )}
                    <Link
                      to={`/explore/styles/${confusionGroup.targetStyleId}`}
                      className="font-sans font-semibold text-primary hover:underline"
                    >
                      {targetStyle?.displayName ?? confusionGroup.targetStyleId}
                    </Link>
                  </div>
                </div>

                {confusionGroup.insufficientCandidates && (
                  <div className="rounded-lg border border-border bg-card p-4 mb-6 max-w-xl">
                    <p className="font-sans text-sm text-muted-foreground">
                      Few or no similar styles passed the filter for this difficulty. This style is
                      quite distinctive. Try &quot;Easy&quot; for more options.
                    </p>
                  </div>
                )}

                {confusionGroup.distractors.length === 0 ? (
                  <p className="text-muted-foreground font-sans">
                    No distractors found for this style and difficulty.
                  </p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {confusionGroup.distractors.map((d) => {
                      const distractorStyle = styleTargets.find((s) => s.id === d.styleId);
                      const distractorValues = distractorStyle
                        ? getNormalizedValues(distractorStyle)
                        : [];
                      return (
                        <div
                          key={d.styleId}
                          className="rounded-xl border border-border bg-card p-4 shadow-soft"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Link
                              to={`/explore/styles/${d.styleId}`}
                              className="font-sans font-semibold text-primary hover:underline"
                            >
                              {d.styleName}
                            </Link>
                            <Chip variant="ghost" className="text-xs">
                              {ROLE_LABEL[d.role]}
                            </Chip>
                          </div>
                          {targetValues.length === RADAR_DIMENSION_IDS.length &&
                            distractorValues.length === RADAR_DIMENSION_IDS.length && (
                              <div className="mb-4">
                                <RadarChart
                                  dimensions={radarDimensions}
                                  primaryValues={targetValues}
                                  secondaryValues={distractorValues}
                                  size={180}
                                />
                              </div>
                            )}
                          <div className="grid grid-cols-3 gap-2 text-xs font-sans mb-3">
                            <div>
                              <p className="text-muted-foreground mb-0.5">Shared</p>
                              <div className="flex flex-wrap gap-0.5">
                                {d.aromaSets.sharedAromas.slice(0, 5).map((a) => (
                                  <span
                                    key={a}
                                    className="rounded bg-muted px-1 py-0.5 text-foreground"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Only target</p>
                              <div className="flex flex-wrap gap-0.5">
                                {d.aromaSets.targetUniqueAromas.slice(0, 3).map((a) => (
                                  <span
                                    key={a}
                                    className="rounded bg-wine-deep/10 text-foreground px-1 py-0.5"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Only distractor</p>
                              <div className="flex flex-wrap gap-0.5">
                                {d.aromaSets.distractorUniqueAromas.slice(0, 3).map((a) => (
                                  <span
                                    key={a}
                                    className="rounded bg-gold-muted/20 text-foreground px-1 py-0.5"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs font-sans mb-1">
                            {d.whyConfusing}
                          </p>
                          <p className="text-foreground text-xs font-sans">
                            {d.howToDistinguish}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ExplorePageShell>
  );
}
