import { useParams, Link } from "react-router-dom";
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

export function GrapeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: grapes, isLoading: grapesLoading } = useQuery({
    queryKey: ["grapes"],
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets, isLoading: stylesLoading } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });

  const grape = grapes?.find((g) => g.id === id);
  const linkedStyles =
    styleTargets?.filter((st) =>
      st.grapes?.some((g) => g.grape.id === id),
    ) ?? [];

  const isLoading = grapesLoading || stylesLoading;

  if (isLoading || !id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-sans">Loading...</p>
      </div>
    );
  }

  if (!grape) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
            Grape not found
          </h1>
          <Link
            to="/explore/grapes"
            className="text-primary hover:underline font-sans"
          >
            Back to Grapes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20">
          <Link
            to="/explore/grapes"
            className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-8 text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Grapes
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
              {grape.displayName}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Chip
                variant="ghost"
                className="border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/5 border"
              >
                {grape.color}
              </Chip>
              <Chip
                variant="ghost"
                className="border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/5 border"
              >
                {linkedStyles.length} style
                {linkedStyles.length === 1 ? "" : "s"}
              </Chip>
            </div>
            {grape.notes && (
              <p className="text-primary-foreground/60 font-sans text-sm leading-relaxed">
                {grape.notes}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-24 space-y-6">
        {/* Associated styles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-card rounded-xl p-6 md:p-8 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
              <Wine className="w-4 h-4 text-wine-light" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Associated styles ({linkedStyles.length})
            </h2>
          </div>
          {linkedStyles.length === 0 ? (
            <p className="text-muted-foreground font-sans">
              No styles linked yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {linkedStyles.map((st, index) => (
                <motion.div
                  key={st.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 + index * 0.04,
                  }}
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
                        <Chip
                          variant="ghost"
                          className="bg-secondary border-border text-muted-foreground text-xs"
                        >
                          Tier {st.ladderTier}
                        </Chip>
                      </div>
                      <div className="space-y-2.5 pt-3 border-t border-border">
                        <WineAttributeBar
                          label="Tannin"
                          minValue={
                            getStructureRange(st.structure, "tannin")
                              ?.minValue ?? 0
                          }
                          maxValue={
                            getStructureRange(st.structure, "tannin")
                              ?.maxValue ?? 0
                          }
                          max={
                            getStructureRange(st.structure, "tannin")
                              ?.scaleMax ?? 5
                          }
                        />
                        <WineAttributeBar
                          label="Body"
                          minValue={
                            getStructureRange(st.structure, "body")
                              ?.minValue ?? 0
                          }
                          maxValue={
                            getStructureRange(st.structure, "body")
                              ?.maxValue ?? 0
                          }
                          max={
                            getStructureRange(st.structure, "body")
                              ?.scaleMax ?? 5
                          }
                        />
                        <WineAttributeBar
                          label="Acidity"
                          minValue={
                            getStructureRange(st.structure, "acidity")
                              ?.minValue ?? 0
                          }
                          maxValue={
                            getStructureRange(st.structure, "acidity")
                              ?.maxValue ?? 0
                          }
                          max={
                            getStructureRange(st.structure, "acidity")
                              ?.scaleMax ?? 5
                          }
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
