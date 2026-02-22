import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { ClimateGradient } from "@/components/visualizations/ClimateGradient";
import { Chip } from "@/components/ui/Chip";
import { BarChart3 } from "lucide-react";

export function ClimateExplorerPage() {
  const [colorFilter, setColorFilter] = useState<"red" | "white" | null>(null);
  const [activeBandIndex, setActiveBandIndex] = useState(0);

  const { data: styleTargets = [], isLoading } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Climate Gradient Explorer"
      subtitle="See how wine styles sit along a cool-to-warm climate gradient. Click a style to view its structure; use the slider to focus each band."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <p className="text-muted-foreground font-sans">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-sm font-sans text-muted-foreground">Filter:</span>
              <Chip
                variant={colorFilter === null ? "selected" : "base"}
                onClick={() => setColorFilter(null)}
                className="cursor-pointer"
              >
                All
              </Chip>
              <Chip
                variant={colorFilter === "red" ? "selected" : "base"}
                onClick={() => setColorFilter("red")}
                className="cursor-pointer"
              >
                Red
              </Chip>
              <Chip
                variant={colorFilter === "white" ? "selected" : "base"}
                onClick={() => setColorFilter("white")}
                className="cursor-pointer"
              >
                White
              </Chip>
            </div>
            <ClimateGradient
              styles={styleTargets}
              colorFilter={colorFilter}
              activeBandIndex={activeBandIndex}
              onBandIndexChange={setActiveBandIndex}
              height={480}
            />
          </>
        )}
      </div>
    </ExplorePageShell>
  );
}
