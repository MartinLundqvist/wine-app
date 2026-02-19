import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Region } from "@wine-app/shared";
import type { StyleTargetFull } from "@wine-app/shared";
import { Panel } from "../../components/ui/Panel";
import { Link } from "react-router-dom";

function RegionTree({
  regions,
  styleTargets,
  parentId,
  depth,
}: {
  regions: Region[];
  styleTargets: StyleTargetFull[];
  parentId: string | null;
  depth: number;
}) {
  const children = useMemo(
    () => regions.filter((r) => (r.parentRegionId ?? null) === parentId),
    [regions, parentId],
  );
  if (children.length === 0) return null;
  return (
    <ul className={depth > 0 ? "ml-4 mt-2 space-y-2 border-l border-cork-500/30 pl-4" : "space-y-4"}>
      {children.map((r) => {
        const stylesInRegion = styleTargets.filter((st) => st.regionId === r.id);
        return (
          <li key={r.id}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-ui text-body text-linen-100"
                style={{ marginLeft: depth * 0 }}
              >
                {r.displayName}
              </span>
              <span className="text-small text-cork-400">
                ({r.country})
                {stylesInRegion.length > 0 && ` · ${stylesInRegion.length} style${stylesInRegion.length === 1 ? "" : "s"}`}
              </span>
            </div>
            {stylesInRegion.length > 0 && (
              <ul className="mt-1 ml-2 space-y-0.5">
                {stylesInRegion.slice(0, 5).map((st) => (
                  <li key={st.id}>
                    <Link
                      to={`/explore/styles/${st.id}`}
                      className="text-small text-cork-300 hover:text-brass-200 no-underline"
                    >
                      {st.displayName}
                    </Link>
                  </li>
                ))}
                {stylesInRegion.length > 5 && (
                  <li className="text-small text-cork-400">
                    +{stylesInRegion.length - 5} more
                  </li>
                )}
              </ul>
            )}
            <RegionTree
              regions={regions}
              styleTargets={styleTargets}
              parentId={r.id}
              depth={depth + 1}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function ExploreRegionsPage() {
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
          Hierarchical view of wine regions. Click a style to see its full profile.
        </p>
      </div>
      <Panel variant="oak">
        <RegionTree
          regions={regions ?? []}
          styleTargets={styleTargets ?? []}
          parentId={null}
          depth={0}
        />
      </Panel>
    </div>
  );
}
