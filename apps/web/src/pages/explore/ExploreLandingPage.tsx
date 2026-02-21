import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wine, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import exploreStylesImg from "@/assets/explore-styles.jpg";
import exploreGrapesImg from "@/assets/explore-grapes.jpg";
import exploreRegionsImg from "@/assets/explore-regions.jpg";
import exploreAromasImg from "@/assets/explore-aromas.jpg";

export function ExploreLandingPage() {
  const { data: grapes } = useQuery({
    queryKey: ["grapes"],
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
  });
  const { data: aromaTerms } = useQuery({
    queryKey: ["aroma-terms"],
    queryFn: () => api.getAromaTerms(),
  });

  const counts = {
    styles: styleTargets?.length ?? 0,
    grapes: grapes?.length ?? 0,
    regions: regions?.length ?? 0,
    aromas: aromaTerms?.length ?? 0,
  };

  const categories = [
    {
      slug: "styles",
      title: "Styles",
      subtitle: "Red, White, Rosé & More",
      description:
        "Discover the major wine styles and learn what makes each one unique — from bold reds to crisp whites and everything in between.",
      image: exploreStylesImg,
      count: `${counts.styles} styles`,
    },
    {
      slug: "grapes",
      title: "Grapes",
      subtitle: "Varietals & Blends",
      description:
        "Explore the world's most celebrated grape varieties — their flavors, origins, and the wines they produce.",
      image: exploreGrapesImg,
      count: `${counts.grapes} varietals`,
    },
    {
      slug: "regions",
      title: "Regions",
      subtitle: "Terroir & Geography",
      description:
        "Journey through iconic wine regions and understand how climate, soil, and tradition shape every bottle.",
      image: exploreRegionsImg,
      count: `${counts.regions} regions`,
    },
    {
      slug: "aromas",
      title: "Aromas",
      subtitle: "Nose & Palate Training",
      description:
        "Train your senses to identify the complex aromas in wine — from fruit and floral to earth and oak.",
      image: exploreAromasImg,
      count: `${counts.aromas} aromas`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-24 md:pb-28">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-8 text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learn
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <Wine className="w-6 h-6 text-wine-light" />
            <p className="text-sm tracking-[0.25em] uppercase text-wine-light font-sans">
              Your Learning Journey
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
          >
            Explore Wines
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl font-sans leading-relaxed"
          >
            Choose a path to deepen your understanding of wine. Each category
            offers curated lessons, tasting guides, and expert insights.
          </motion.p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Link
                to={`/explore/${cat.slug}`}
                className="group block relative overflow-hidden rounded-2xl shadow-soft hover:shadow-wine transition-shadow duration-500"
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cellar via-cellar/50 to-transparent" />

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <span className="text-xs font-sans tracking-wider uppercase text-wine-light mb-2">
                      {cat.count}
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                      {cat.title}
                    </h2>
                    <p className="text-sm font-sans text-primary-foreground/60 tracking-wide uppercase mb-3">
                      {cat.subtitle}
                    </p>
                    <p className="text-primary-foreground/80 text-sm md:text-base font-sans leading-relaxed max-w-md mb-4">
                      {cat.description}
                    </p>
                    <div className="flex items-center gap-2 text-wine-light font-sans text-sm font-medium group-hover:gap-3 transition-all duration-300">
                      Start Exploring
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
