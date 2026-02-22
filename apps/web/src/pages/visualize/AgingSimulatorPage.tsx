import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { AgingTimeline } from "@/components/visualizations/AgingTimeline";
import { Chip } from "@/components/ui/Chip";
import { BarChart3 } from "lucide-react";

type ViewMode = "structure" | "aroma" | "both";

export function AgingSimulatorPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [mode, setMode] = useState<ViewMode>("both");

  const { data: styleTargets = [], isLoading } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const { data: structureDimensions = [] } = useQuery({
    queryKey: queryKeys.structureDimensions,
    queryFn: () => api.getStructureDimensions(),
  });

  const selectedStyle = selectedId
    ? styleTargets.find((s) => s.id === selectedId) ?? null
    : null;

  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Aging Simulator"
      subtitle="Watch how structure and aromas evolve from young to developing to mature. General oenological heuristics; per-style data may be added later."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <p className="text-muted-foreground font-sans">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="aging-style" className="text-sm font-sans text-muted-foreground">
                  Style
                </label>
                <select
                  id="aging-style"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-2 font-sans text-sm text-foreground min-w-[200px]"
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
                <span className="text-sm font-sans text-muted-foreground">View</span>
                <div className="flex gap-2">
                  <Chip
                    variant={mode === "structure" ? "selected" : "base"}
                    onClick={() => setMode("structure")}
                    className="cursor-pointer"
                  >
                    Structure only
                  </Chip>
                  <Chip
                    variant={mode === "aroma" ? "selected" : "base"}
                    onClick={() => setMode("aroma")}
                    className="cursor-pointer"
                  >
                    Aroma only
                  </Chip>
                  <Chip
                    variant={mode === "both" ? "selected" : "base"}
                    onClick={() => setMode("both")}
                    className="cursor-pointer"
                  >
                    Both
                  </Chip>
                </div>
              </div>
            </div>

            <AgingTimeline
              style={selectedStyle}
              mode={mode}
              structureDimensions={structureDimensions}
            />
          </>
        )}
      </div>
    </ExplorePageShell>
  );
}
