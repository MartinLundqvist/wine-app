import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flower2, AlertCircle, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { AromaFlowTree } from "../../components/aroma/AromaFlowTree";
import { Button } from "../../components/ui/Button";

function AromaExplorerSkeleton() {
  return (
    <div className="relative min-h-[420px]" aria-hidden>
      <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border">
        <div className="h-4 w-32 rounded bg-muted animate-pulse motion-reduce:animate-none" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="h-4 w-20 rounded bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-full max-w-[200px] rounded bg-muted/80 animate-pulse motion-reduce:animate-none" />
            <div className="flex flex-col gap-3">
              {i === 1 ? [1, 2, 3].map((j) => (
                <div key={j} className="h-20 rounded-xl bg-muted/60 animate-pulse motion-reduce:animate-none" />
              )) : i === 2 ? [1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-12 rounded-lg bg-muted/60 animate-pulse motion-reduce:animate-none" />
              )) : (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <div key={j} className="h-8 w-20 rounded-full bg-muted/60 animate-pulse motion-reduce:animate-none" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExploreAromasPage() {
  const { data: aromaTerms, isLoading, isError, refetch } = useQuery({
    queryKey: ["aroma-terms"],
    queryFn: () => api.getAromaTerms(),
  });

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
            <Flower2 className="w-6 h-6 text-wine-light" />
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
            Aromas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg max-w-2xl font-sans leading-relaxed"
          >
            Train your senses with the WSET aroma wheel. Trace from source —
            primary, secondary, tertiary — through clusters to specific
            descriptors.
          </motion.p>
        </div>
      </div>

      {/* Content card */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-xl p-6 shadow-soft overflow-visible"
        >
          {isLoading ? (
            <AromaExplorerSkeleton />
          ) : isError ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
              role="alert"
            >
              <AlertCircle className="w-12 h-12 text-destructive mb-4" aria-hidden />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Couldn’t load aromas
              </h2>
              <p className="text-muted-foreground font-sans max-w-sm mb-6">
                Something went wrong fetching the aroma taxonomy. Please try again.
              </p>
              <Button variant="primary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : aromaTerms && aromaTerms.length > 0 ? (
            <AromaFlowTree terms={aromaTerms} />
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
              role="status"
            >
              <Inbox className="w-12 h-12 text-muted-foreground/60 mb-4" aria-hidden />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                No aroma terms yet
              </h2>
              <p className="text-muted-foreground font-sans max-w-sm">
                The aroma taxonomy hasn’t been loaded. Check back later or contact support.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
