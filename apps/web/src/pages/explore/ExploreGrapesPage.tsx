import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import type { GrapeWithStyleTargets } from "@wine-app/shared";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Chip } from "../../components/ui/Chip";
import { ExplorePageShell } from "../../components/explore/ExplorePageShell";
import { FilterBar } from "../../components/explore/FilterBar";

const filterOptions = [
  { label: "All", value: "" },
  { label: "Red", value: "red" },
  { label: "White", value: "white" },
] as const;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "styles", label: "Styles" },
] as const;

function styleCount(g: GrapeWithStyleTargets): number {
  return g.styleTargetIds?.length ?? 0;
}

export function ExploreGrapesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorFilter = searchParams.get("color") ?? "";
  const sortBy = (searchParams.get("sort") ?? "name") as (typeof sortOptions)[number]["value"];

  const { data: grapes, isLoading } = useQuery({
    queryKey: queryKeys.grapes,
    queryFn: () => api.getGrapes(),
  });

  const filtered = useMemo(() => {
    if (!grapes) return [];
    let list: GrapeWithStyleTargets[] = [...grapes];
    if (colorFilter === "red" || colorFilter === "white") {
      list = list.filter((g) => g.color === colorFilter);
    }
    if (sortBy === "name") {
      list.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.displayName.localeCompare(b.displayName),
      );
    } else {
      list.sort(
        (a, b) =>
          styleCount(b) - styleCount(a) ||
          a.displayName.localeCompare(b.displayName),
      );
    }
    return list;
  }, [grapes, colorFilter, sortBy]);

  const handleFilterChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("color", value);
    else next.delete("color");
    setSearchParams(next);
  };

  const handleSortChange = (value: (typeof sortOptions)[number]["value"]) => {
    setSearchParams({ ...Object.fromEntries(searchParams), sort: value });
  };

  return (
    <ExplorePageShell
      title="Grape Varieties"
      subtitle="Browse grape varieties. Filter by color and sort by name or number of associated styles."
      icon={<Wine className="w-6 h-6 text-wine-light" />}
      backTo={{ path: "/explore", label: "Back to Explore" }}
    >
      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <FilterBar
          filterOptions={filterOptions}
          filterValue={colorFilter}
          onFilterChange={handleFilterChange}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={handleSortChange}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 pb-24">
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground font-sans">
            No grape varieties match the current filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g, index) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.04 }}
              >
                <Link
                  to={`/explore/grapes/${g.id}`}
                  className="group block rounded-xl overflow-hidden shadow-soft border border-border hover:shadow-wine transition-all duration-500 hover:-translate-y-1.5 no-underline"
                >
                  <div
                    className={`h-1.5 ${
                      g.color === "red"
                        ? "bg-gradient-to-r from-wine-deep to-wine-rich"
                        : g.color === "white"
                          ? "bg-gradient-to-r from-oak-light to-cream-dark"
                          : "bg-gradient-to-r from-wine-light to-cream-dark"
                    }`}
                  />
                  <div className="bg-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-wine-light transition-colors">
                        {g.displayName}
                      </h3>
                      <span
                        className={`text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          g.color === "red"
                            ? "bg-wine-deep/15 text-wine-light"
                            : g.color === "white"
                              ? "bg-oak/15 text-oak-light"
                              : "bg-wine-light/15 text-wine-light"
                        }`}
                      >
                        {g.color}
                      </span>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Chip
                        variant="ghost"
                        className="bg-secondary border-border text-muted-foreground text-xs"
                      >
                        {styleCount(g)} style{styleCount(g) === 1 ? "" : "s"}
                      </Chip>
                    </div>
                    {g.notes && (
                      <p className="text-sm text-muted-foreground font-sans leading-relaxed pt-3 border-t border-border line-clamp-2">
                        {g.notes.length > 80
                          ? `${g.notes.slice(0, 80).trim()}…`
                          : g.notes}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ExplorePageShell>
  );
}
