import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import type { StyleTargetFull } from "@wine-app/shared";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Chip } from "../../components/ui/Chip";
import { WineAttributeBar } from "../../components/ui/WineAttributeBar";

export function StyleTargetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: style, isLoading, error } = useQuery({
    queryKey: queryKeys.styleTarget(id!),
    queryFn: () => api.getStyleTarget(id!),
    enabled: !!id,
  });

  if (isLoading || !id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !style) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
            Style not found
          </h1>
          <Link
            to="/explore/styles"
            className="text-primary hover:underline font-sans"
          >
            Back to Styles
          </Link>
        </div>
      </div>
    );
  }

  const st = style as StyleTargetFull;
  const ordinalDims =
    st.structure?.filter((s) => s.dimension?.scaleType === "ordinal") ?? [];
  const catDims =
    st.structure?.filter((s) => s.dimension?.scaleType === "categorical") ?? [];
  const aromasBySource = (st.aromas ?? []).reduce(
    (acc, a) => {
      const src = a.term?.source ?? "primary";
      if (!acc[src]) acc[src] = [];
      if (a.term) acc[src].push(a);
      return acc;
    },
    {} as Record<string, typeof st.aromas>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20">
          <Link
            to="/explore/styles"
            className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-8 text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Styles
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
              {st.displayName}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {st.region && (
                <Chip
                  variant="ghost"
                  className="border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/5 border"
                >
                  {st.region.displayName}
                </Chip>
              )}
              <Chip
                variant="ghost"
                className="border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/5 border"
              >
                Tier {st.ladderTier}
              </Chip>
              <Chip
                variant="ghost"
                className="border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/5 border"
              >
                {st.styleKind.replace(/_/g, " ")}
              </Chip>
            </div>
            {st.grapes && st.grapes.length > 0 && (
              <p className="text-primary-foreground/60 font-sans text-sm">
                Grapes: {st.grapes.map((g) => g.grape.displayName).join(", ")}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-24 space-y-6">
        {/* Description */}
        {st.context?.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-card rounded-xl p-6 shadow-soft border border-border"
          >
            <p className="font-sans text-foreground/80 leading-relaxed text-lg italic">
              {st.context.notes}
            </p>
          </motion.div>
        )}

        {/* Quick Facts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: "Color", val: st.producedColor },
            { label: "Kind", val: st.styleKind.replace(/_/g, " ") },
            { label: "Category", val: st.wineCategory },
            {
              label: "Thermal band",
              val: st.context?.thermalBandId ?? "—",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-xl p-4 shadow-soft border border-border text-center"
            >
              <span className="block text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-1">
                {item.label}
              </span>
              <span className="block font-serif text-sm font-semibold text-foreground capitalize">
                {item.val}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card rounded-xl p-6 md:p-8 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
              <Wine className="w-4 h-4 text-wine-light" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Structure
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {ordinalDims.map((row) => {
              const dim = row.dimension;
              const scaleMax = dim?.scaleMax ?? 5;
              const min = row.minValue ?? row.maxValue ?? 0;
              const max = row.maxValue ?? row.minValue ?? 0;
              return (
                <WineAttributeBar
                  key={row.structureDimensionId}
                  label={dim?.displayName ?? row.structureDimensionId}
                  minValue={min}
                  maxValue={max}
                  max={scaleMax}
                />
              );
            })}
          </div>
          {catDims.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {catDims.map((row) => (
                  <Chip
                    key={row.structureDimensionId}
                    variant="ghost"
                    className="bg-secondary border-border text-muted-foreground border"
                  >
                    {row.dimension?.displayName}: {row.categoricalValue ?? "—"}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Aroma profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-xl p-6 md:p-8 shadow-soft border border-border"
        >
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
            Aroma Profile
          </h2>
          <div className="space-y-5">
            {["primary", "secondary", "tertiary"].map((source) => {
              const list = aromasBySource[source];
              if (!list?.length) return null;
              const sourceStyles =
                source === "primary"
                  ? "text-xs font-sans tracking-widest uppercase text-wine-light font-semibold mb-3"
                  : source === "secondary"
                    ? "text-xs font-sans tracking-widest uppercase text-oak-light font-semibold mb-3"
                    : "text-xs font-sans tracking-widest uppercase text-muted-foreground font-semibold mb-3";
              const badgeStyles =
                source === "primary"
                  ? "bg-wine-deep/10 border border-wine-deep/20 text-wine-light font-sans text-sm px-3 py-1"
                  : source === "secondary"
                    ? "bg-oak/10 border border-oak/20 text-oak-light font-sans text-sm px-3 py-1"
                    : "bg-secondary border-border text-muted-foreground font-sans text-sm px-3 py-1";
              return (
                <div key={source}>
                  <h3 className={sourceStyles}>{source}</h3>
                  <div className="flex flex-wrap gap-2">
                    {list.map((a) => (
                      <Chip
                        key={a.aromaTermId}
                        variant="ghost"
                        className={badgeStyles}
                      >
                        {a.term?.displayName} ({a.prominence})
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Context */}
        {st.context &&
          (st.context.thermalBandId ||
            st.context.continentality ||
            st.context.oakNewPercentageRange ||
            st.context.malolacticConversion != null ||
            st.context.agingPotentialYearsMin != null) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card rounded-xl p-6 md:p-8 shadow-soft border border-border"
            >
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                Context
              </h2>
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                {st.context.thermalBandId && (
                  <>
                    <dt className="text-sm font-sans text-muted-foreground">
                      Thermal band
                    </dt>
                    <dd>
                      <Chip
                        variant="ghost"
                        className="bg-oak/10 border border-oak/20 text-oak-light font-sans text-sm px-3 py-1 capitalize"
                      >
                        {st.context.thermalBandId}
                      </Chip>
                    </dd>
                  </>
                )}
                {st.context.continentality && (
                  <>
                    <dt className="text-sm font-sans text-muted-foreground">
                      Continentality
                    </dt>
                    <dd className="font-sans font-medium text-foreground">
                      {st.context.continentality}
                    </dd>
                  </>
                )}
                {st.context.oakNewPercentageRange && (
                  <>
                    <dt className="text-sm font-sans text-muted-foreground">
                      Oak (new %)
                    </dt>
                    <dd className="font-sans font-medium text-foreground">
                      {st.context.oakNewPercentageRange}
                    </dd>
                  </>
                )}
                {st.context.malolacticConversion && (
                  <>
                    <dt className="text-sm font-sans text-muted-foreground">
                      Malolactic
                    </dt>
                    <dd className="font-sans font-medium text-foreground">
                      {st.context.malolacticConversion}
                    </dd>
                  </>
                )}
                {st.context.agingPotentialYearsMin != null && (
                  <>
                    <dt className="text-sm font-sans text-muted-foreground">
                      Aging potential (years)
                    </dt>
                    <dd className="font-sans font-medium text-foreground">
                      {st.context.agingPotentialYearsMin}
                      {st.context.agingPotentialYearsMax != null &&
                        ` – ${st.context.agingPotentialYearsMax}`}
                    </dd>
                  </>
                )}
              </dl>
            </motion.div>
          )}
      </div>
    </div>
  );
}
