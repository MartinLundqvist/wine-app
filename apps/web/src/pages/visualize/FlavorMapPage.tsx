import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";
import { FlavorMap } from "@/components/visualizations/FlavorMap";
import { Chip } from "@/components/ui/Chip";
import { BarChart3 } from "lucide-react";

export function FlavorMapPage() {
  const [isRed, setIsRed] = useState(true);
  const [climateFilter, setClimateFilter] = useState<string | null>(null);

  const { data: styleTargets = [], isLoading } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const { data: thermalBands = [] } = useQuery({
    queryKey: queryKeys.thermalBands,
    queryFn: () => api.getThermalBands(),
  });

  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Flavor Direction Map"
      subtitle="Plot wine styles by fruit direction and earth/herb character. Red and white wines use different axes; normalize to observed range so small differences are visible."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <p className="text-muted-foreground font-sans">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-sans text-muted-foreground">Color:</span>
                <Chip
                  variant={isRed ? "selected" : "base"}
                  onClick={() => setIsRed(true)}
                  className="cursor-pointer"
                >
                  Red
                </Chip>
                <Chip
                  variant={!isRed ? "selected" : "base"}
                  onClick={() => setIsRed(false)}
                  className="cursor-pointer"
                >
                  White
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-sans text-muted-foreground">Climate:</span>
                <Chip
                  variant={climateFilter === null ? "selected" : "base"}
                  onClick={() => setClimateFilter(null)}
                  className="cursor-pointer"
                >
                  All
                </Chip>
                {thermalBands.map((tb) => (
                  <Chip
                    key={tb.id}
                    variant={climateFilter === tb.id ? "selected" : "base"}
                    onClick={() => setClimateFilter(climateFilter === tb.id ? null : tb.id)}
                    className="cursor-pointer"
                  >
                    {tb.id.charAt(0).toUpperCase() + tb.id.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
            <FlavorMap
              styles={styleTargets}
              isRed={isRed}
              climateFilter={climateFilter}
              width={560}
              height={420}
            />
          </>
        )}
      </div>
    </ExplorePageShell>
  );
}
