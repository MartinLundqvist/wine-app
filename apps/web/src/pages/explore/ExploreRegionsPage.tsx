import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { RegionMap } from "../../components/regions/RegionMap";
import { RegionDetailPanel } from "../../components/regions/RegionDetailPanel";

export function ExploreRegionsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { data: regions, isLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });

  if (isLoading) return <p className="text-cork-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-linen-100">Regions</h1>
        <p className="text-cork-400 mt-1">
          Click a wine country on the map to see its sub-regions and wine styles.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <RegionMap
            regions={regions ?? []}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </div>
        {selectedCountry && (
          <RegionDetailPanel
            country={selectedCountry}
            regions={regions ?? []}
            styleTargets={styleTargets ?? []}
            onClose={() => setSelectedCountry(null)}
          />
        )}
      </div>
    </div>
  );
}
