import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { StyleTargetFull } from "@wine-app/shared";
import { Chip } from "../../components/ui/Chip";
import { WineAttributeBar } from "../../components/ui/WineAttributeBar";

type StructureRow = NonNullable<StyleTargetFull["structure"]>[number];

function getStructureRow(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): StructureRow | undefined {
  return structure?.find(
    (s) =>
      s.structureDimensionId === dimensionId || s.dimension?.id === dimensionId,
  );
}

/** Returns min, max, and scale max for an ordinal dimension. Used for range display and sort. */
function getStructureRange(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): { minValue: number; maxValue: number; scaleMax: number } | null {
  const row = getStructureRow(structure, dimensionId);
  if (!row?.dimension || row.dimension.scaleType !== "ordinal") return null;
  const scaleMax = row.dimension.scaleMax ?? 5;
  const min = row.minValue ?? row.maxValue ?? 0;
  const max = row.maxValue ?? row.minValue ?? 0;
  return {
    minValue: Math.min(min, max),
    maxValue: Math.min(Math.max(min, max), scaleMax),
    scaleMax,
  };
}

/** Single numeric value for sorting: midpoint when range, else the value. */
function getStructureSortValue(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): number {
  const range = getStructureRange(structure, dimensionId);
  if (!range) return 0;
  return (range.minValue + range.maxValue) / 2;
}

const filterOptions = [
  { label: "All", value: "" },
  { label: "Red", value: "red" },
  { label: "White", value: "white" },
] as const;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "tier", label: "Tier" },
  { value: "tannin", label: "Tannin (high→low)" },
] as const;

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
      list = list.filter((st) => st.producedColor === colorFilter);
    }
    if (sortBy === "name")
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sortBy === "tier")
      list.sort(
        (a, b) =>
          a.ladderTier - b.ladderTier ||
          a.displayName.localeCompare(b.displayName),
      );
    else if (sortBy === "tannin") {
      list.sort((a, b) => {
        const tanninA = getStructureSortValue(a.structure, "tannin");
        const tanninB = getStructureSortValue(b.structure, "tannin");
        return tanninB - tanninA;
      });
    }
    return list;
  }, [styleTargets, colorFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-24 md:pb-28">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-8 text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <Wine className="w-6 h-6 text-wine-light" />
            <p className="text-sm tracking-[0.25em] uppercase text-wine-light font-sans">
              Explore
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
          >
            Wine Styles
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg max-w-2xl font-sans leading-relaxed"
          >
            Browse benchmark styles. Filter by color and sort by name, tier, or
            structure.
          </motion.p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center gap-6 bg-card rounded-xl p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-sans text-muted-foreground font-medium">
              Color:
            </span>
            <div className="flex gap-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    if (opt.value) next.set("color", opt.value);
                    else next.delete("color");
                    setSearchParams(next);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all duration-200 ${
                    colorFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-sans text-muted-foreground font-medium">
              Sort:
            </span>
            <div className="flex gap-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setSearchParams({
                      ...Object.fromEntries(searchParams),
                      sort: opt.value,
                    })
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all duration-200 ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10 pb-24">
        {isLoading ? (
          <p className="text-muted-foreground font-sans">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((st, index) => (
              <motion.div
                key={st.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.04 }}
              >
                <Link
                  to={`/explore/styles/${st.id}`}
                  className="group block rounded-xl overflow-hidden shadow-soft hover:shadow-wine transition-all duration-500 hover:-translate-y-1.5 no-underline"
                >
                  <div
                    className={`h-1.5 ${
                      st.producedColor === "red"
                        ? "bg-gradient-to-r from-wine-deep to-wine-rich"
                        : st.producedColor === "white"
                          ? "bg-gradient-to-r from-oak-light to-cream-dark"
                          : "bg-gradient-to-r from-wine-light to-cream-dark"
                    }`}
                  />
                  <div className="bg-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-wine-light transition-colors">
                        {st.displayName}
                      </h3>
                      <span
                        className={`text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          st.producedColor === "red"
                            ? "bg-wine-deep/15 text-wine-light"
                            : st.producedColor === "white"
                              ? "bg-oak/15 text-oak-light"
                              : "bg-wine-light/15 text-wine-light"
                        }`}
                      >
                        {st.producedColor}
                      </span>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {st.region && (
                        <Chip
                          variant="ghost"
                          className="bg-secondary border-border text-muted-foreground text-xs"
                        >
                          {st.region.displayName}
                        </Chip>
                      )}
                      {st.grapes?.map(({ grape }) => (
                        <Chip
                          key={grape.id}
                          variant="ghost"
                          className="bg-secondary border-border text-muted-foreground text-xs"
                        >
                          {grape.displayName}
                        </Chip>
                      ))}
                      <Chip
                        variant="ghost"
                        className="bg-secondary border-border text-muted-foreground text-xs"
                      >
                        Tier {st.ladderTier}
                      </Chip>
                    </div>
                    <div className="space-y-2.5 pt-3 border-t border-border">
                      {(() => {
                        const tannin = getStructureRange(st.structure, "tannin");
                        return (
                          <WineAttributeBar
                            label="Tannin"
                            minValue={tannin?.minValue ?? 0}
                            maxValue={tannin?.maxValue ?? 0}
                            max={tannin?.scaleMax ?? 5}
                          />
                        );
                      })()}
                      {(() => {
                        const body = getStructureRange(st.structure, "body");
                        return (
                          <WineAttributeBar
                            label="Body"
                            minValue={body?.minValue ?? 0}
                            maxValue={body?.maxValue ?? 0}
                            max={body?.scaleMax ?? 5}
                          />
                        );
                      })()}
                      {(() => {
                        const acidity = getStructureRange(st.structure, "acidity");
                        return (
                          <WineAttributeBar
                            label="Acidity"
                            minValue={acidity?.minValue ?? 0}
                            maxValue={acidity?.maxValue ?? 0}
                            max={acidity?.scaleMax ?? 5}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
