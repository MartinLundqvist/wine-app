import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { GrapeWithStyleTargets } from "@wine-app/shared";
import { Panel } from "../../components/ui/Panel";
import { Chip } from "../../components/ui/Chip";
import { Button } from "../../components/ui/Button";

export function ExploreGrapesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorFilter = searchParams.get("color") ?? "";

  const { data: grapes, isLoading } = useQuery({
    queryKey: ["grapes"],
    queryFn: () => api.getGrapes(),
  });

  const filtered = useMemo(() => {
    if (!grapes) return [];
    let list: GrapeWithStyleTargets[] = [...grapes];
    if (colorFilter === "red" || colorFilter === "white") {
      list = list.filter((g) => g.color === colorFilter);
    }
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
    return list;
  }, [grapes, colorFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-linen-100">Grapes</h1>
        <p className="text-cork-400 mt-1">
          Browse grape varieties. Filter by color and click through to see associated styles.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-small text-cork-400 self-center">Color:</span>
        {["", "red", "white"].map((c) => (
          <Button
            key={c || "all"}
            variant={colorFilter === c ? "primary" : "tertiary"}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              if (c) next.set("color", c);
              else next.delete("color");
              setSearchParams(next);
            }}
          >
            {c || "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-cork-400">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <Link key={g.id} to={`/explore/grapes/${g.id}`} className="no-underline">
              <Panel variant="oak" className="h-full transition-colors duration-base hover:border-brass-500/50">
                <h3 className="font-display text-h3 text-linen-100">{g.displayName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Chip variant={g.color === "red" ? "selected" : "base"}>
                    {g.color}
                  </Chip>
                  <span className="text-small text-cork-400">
                    {(g.styleTargetIds?.length ?? 0)} style{(g.styleTargetIds?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
