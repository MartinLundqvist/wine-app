import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Region } from "@wine-app/shared";
import type { StyleTargetFull } from "@wine-app/shared";
import { Panel } from "../ui/Panel";

type RegionDetailPanelProps = {
  country: string;
  regions: Region[];
  styleTargets: StyleTargetFull[];
  onClose: () => void;
};

export function RegionDetailPanel({
  country,
  regions,
  styleTargets,
  onClose,
}: RegionDetailPanelProps) {
  const { rootRegion, subRegions, stylesByRegionId } = useMemo(() => {
    const rootRegion = regions.find(
      (r) => (r.parentRegionId ?? null) === null && r.country === country,
    );
    if (!rootRegion) {
      return {
        rootRegion: null,
        subRegions: [] as Region[],
        stylesByRegionId: new Map<string, StyleTargetFull[]>(),
      };
    }
    const subRegions = regions
      .filter((r) => r.parentRegionId === rootRegion.id)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const stylesByRegionId = new Map<string, StyleTargetFull[]>();
    for (const st of styleTargets) {
      if (st.regionId) {
        const list = stylesByRegionId.get(st.regionId) ?? [];
        list.push(st);
        stylesByRegionId.set(st.regionId, list);
      }
    }
    return { rootRegion, subRegions, stylesByRegionId };
  }, [country, regions, styleTargets]);

  if (!rootRegion) return null;

  return (
    <Panel
      variant="oak"
      className="w-full lg:w-80 flex-shrink-0 flex flex-col max-h-[70vh] lg:max-h-none overflow-hidden transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-serif text-2xl text-foreground">{country}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground font-sans text-base transition-colors duration-150"
          aria-label="Close"
        >
          Close
        </button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {subRegions.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">
            No sub-regions in this country.
          </p>
        ) : (
          subRegions.map((sub) => {
            const styles = stylesByRegionId.get(sub.id) ?? [];
            return (
              <div key={sub.id} className="space-y-2">
                <h3 className="font-sans text-base text-foreground font-medium">
                  {sub.displayName}
                </h3>
                {styles.length > 0 ? (
                  <ul className="space-y-1 ml-0">
                    {styles.map((st) => (
                      <li key={st.id}>
                        <Link
                          to={`/explore/styles/${st.id}`}
                          className="text-sm text-muted-foreground hover:text-oak-light no-underline font-ui"
                        >
                          {st.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">
                    No styles linked
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
