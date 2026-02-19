import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { StyleTargetFull } from "@wine-app/shared";
import { Panel } from "../../components/ui/Panel";
import { Chip } from "../../components/ui/Chip";
import { Button } from "../../components/ui/Button";

function StructureBar({
  structure,
  dimensionId,
  maxVal = 5,
}: {
  structure: StyleTargetFull["structure"];
  dimensionId: string;
  maxVal?: number;
}) {
  const row = structure?.find(
    (s) => s.structureDimensionId === dimensionId || s.dimension?.id === dimensionId
  );
  if (!row) return null;
  const min = row.minValue ?? 0;
  const max = row.maxValue ?? min;
  const cat = row.categoricalValue;
  if (cat) return <span className="text-small text-cork-300">{cat}</span>;
  const pct = maxVal > 0 ? (max / maxVal) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-cellar-800 rounded overflow-hidden">
        <div
          className="h-full bg-burgundy-600 rounded"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-micro text-cork-400">
        {min === max ? min : `${min}–${max}`}
      </span>
    </div>
  );
}

export function ExploreStylesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorFilter = searchParams.get("color") ?? "";
  const sortBy = searchParams.get("sort") ?? "name";

  const { data: styleTargets, isLoading } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });

  const filtered = useMemo(() => {
    if (!styleTargets) return [];
    let list = [...styleTargets];
    if (colorFilter === "red" || colorFilter === "white") {
      list = list.filter((st) => {
        const primaryGrape = st.grapes?.find((g) => g.role === "primary")?.grape;
        return primaryGrape?.color === colorFilter;
      });
    }
    if (sortBy === "name")
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sortBy === "tier")
      list.sort((a, b) => a.ladderTier - b.ladderTier || a.displayName.localeCompare(b.displayName));
    else if (sortBy === "tannin") {
      list.sort((a, b) => {
        const getTannin = (st: StyleTargetFull) => {
          const row = st.structure?.find(
            (s) => s.structureDimensionId === "tannin" || s.dimension?.id === "tannin"
          );
          return row?.maxValue ?? row?.minValue ?? 0;
        };
        return getTannin(b) - getTannin(a);
      });
    }
    return list;
  }, [styleTargets, colorFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 text-linen-100">Wine Styles</h1>
          <p className="text-cork-400 mt-1">
            Browse benchmark styles. Filter by color and sort by name, tier, or structure.
          </p>
        </div>
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
        <span className="text-small text-cork-400 self-center ml-4">Sort:</span>
        {[
          { value: "name", label: "Name" },
          { value: "tier", label: "Tier" },
          { value: "tannin", label: "Tannin (high→low)" },
        ].map(({ value, label }) => (
          <Button
            key={value}
            variant={sortBy === value ? "primary" : "tertiary"}
            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), sort: value })}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-cork-400">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((st) => (
            <Link key={st.id} to={`/explore/styles/${st.id}`} className="no-underline">
              <Panel variant="oak" className="h-full transition-colors duration-base hover:border-brass-500/50">
                <h3 className="font-display text-h3 text-linen-100">{st.displayName}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {st.region && (
                    <Chip variant="ghost">{st.region.displayName}</Chip>
                  )}
                  {st.grapes?.map(({ grape }) => (
                    <Chip key={grape.id} variant="ghost">
                      {grape.displayName}
                    </Chip>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center gap-2 text-micro text-cork-400">
                    <span>Tannin</span>
                    <StructureBar structure={st.structure} dimensionId="tannin" />
                  </div>
                  <div className="flex justify-between items-center gap-2 text-micro text-cork-400">
                    <span>Body</span>
                    <StructureBar structure={st.structure} dimensionId="body" />
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
