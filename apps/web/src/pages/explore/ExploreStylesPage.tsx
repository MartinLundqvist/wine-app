import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { getStructureSortValue } from "../../lib/wine-structure";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ExplorePageShell } from "../../components/explore/ExplorePageShell";
import { FilterBar } from "../../components/explore/FilterBar";
import { StyleCard } from "../../components/explore/StyleCard";

const filterOptions = [
  { label: "All", value: "" },
  { label: "Red", value: "red" },
  { label: "White", value: "white" },
] as const;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "tannin", label: "Tannin (high→low)" },
] as const;

export function ExploreStylesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorFilter = searchParams.get("color") ?? "";
  const sortBy = (searchParams.get("sort") ?? "name") as (typeof sortOptions)[number]["value"];

  const { data: styleTargets, isLoading } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });

  const filtered = useMemo(() => {
    if (!styleTargets) return [];
    let list = [...styleTargets];
    if (colorFilter === "red" || colorFilter === "white") {
      list = list.filter((st) => st.producedColor === colorFilter);
    }
    if (sortBy === "name")
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sortBy === "type")
      list.sort(
        (a, b) =>
          a.styleType.localeCompare(b.styleType) ||
          a.displayName.localeCompare(b.displayName),
      );
    else if (sortBy === "tannin") {
      list.sort((a, b) => {
        const tanninA = getStructureSortValue(a.structure, "tannins");
        const tanninB = getStructureSortValue(b.structure, "tannins");
        return tanninB - tanninA;
      });
    }
    return list;
  }, [styleTargets, colorFilter, sortBy]);

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
      title="Wine Styles"
      subtitle="Browse benchmark styles. Filter by color and sort by name, tier, or structure."
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((st, index) => (
              <StyleCard key={st.id} style={st} index={index} />
            ))}
          </div>
        )}
      </div>
    </ExplorePageShell>
  );
}
