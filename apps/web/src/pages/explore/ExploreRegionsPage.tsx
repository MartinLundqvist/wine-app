import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, AlertCircle, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { RegionMap } from "../../components/regions/RegionMap";
import { RegionDetailPanel } from "../../components/regions/RegionDetailPanel";
import { Button } from "../../components/ui/Button";

function MapSkeleton() {
  return (
    <div
      className="w-full aspect-[16/10] rounded-lg bg-muted/50 animate-pulse motion-reduce:animate-none flex items-center justify-center"
      aria-hidden
    >
      <span className="text-muted-foreground font-sans text-sm">
        Loading map…
      </span>
    </div>
  );
}

export function ExploreRegionsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const { data: regions, isLoading, isError, refetch } = useQuery({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });

  const handleClose = useCallback(() => setSelectedCountry(null), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
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
            <MapPin className="w-6 h-6 text-wine-light" />
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
            Wine Regions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg max-w-2xl font-sans leading-relaxed"
          >
            Click a wine country on the map to see its sub-regions and wine
            styles. Tap or hover to explore.
          </motion.p>
        </div>
      </div>

      {/* Map card — fixed layout; panel overlays */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative bg-card rounded-xl overflow-hidden shadow-soft"
        >
          {isLoading ? (
            <MapSkeleton />
          ) : isError ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[320px]"
              role="alert"
            >
              <AlertCircle
                className="w-12 h-12 text-destructive mb-4"
                aria-hidden
              />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Couldn&apos;t load regions
              </h2>
              <p className="text-muted-foreground font-sans max-w-sm mb-6">
                Something went wrong fetching regions. Please try again.
              </p>
              <Button variant="primary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : regions && regions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[320px]"
              role="status"
            >
              <Inbox
                className="w-12 h-12 text-muted-foreground/60 mb-4"
                aria-hidden
              />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                No regions yet
              </h2>
              <p className="text-muted-foreground font-sans max-w-sm">
                Region data hasn&apos;t been loaded. Check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full aspect-[16/10] min-h-[280px]">
                <RegionMap
                  regions={regions ?? []}
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                />
              </div>

              <AnimatePresence mode="wait">
                {selectedCountry && (
                  <RegionDetailPanel
                    country={selectedCountry}
                    regions={regions ?? []}
                    styleTargets={styleTargets ?? []}
                    onClose={handleClose}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
