import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Chip } from "../../components/ui/Chip";
import { StyleCard } from "../../components/explore/StyleCard";

export function GrapeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: grapes, isLoading: grapesLoading } = useQuery({
    queryKey: queryKeys.grapes,
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets, isLoading: stylesLoading } = useQuery({
    queryKey: queryKeys.styleTargets,
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
        <LoadingSpinner />
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
                <StyleCard key={st.id} style={st} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
