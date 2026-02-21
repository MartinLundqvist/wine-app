import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { GrapeWithStyleTargets } from "@wine-app/shared";
import { Chip } from "../../components/ui/Chip";

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
  const sortBy = searchParams.get("sort") ?? "name";

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
            Grape Varieties
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg max-w-2xl font-sans leading-relaxed"
          >
            Browse grape varieties. Filter by color and sort by name or number of
            associated styles.
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
                  className="group block rounded-xl overflow-hidden shadow-soft hover:shadow-wine transition-all duration-500 hover:-translate-y-1.5 no-underline"
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
    </div>
  );
}
