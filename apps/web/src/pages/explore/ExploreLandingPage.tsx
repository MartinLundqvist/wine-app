import { motion } from "framer-motion";
import { Wine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { SectionHero } from "@/components/shared/SectionHero";
import { OverlayImageCard } from "@/components/shared/OverlayImageCard";
import exploreStylesImg from "@/assets/explore-styles.jpg";
import exploreGrapesImg from "@/assets/explore-grapes.jpg";
import exploreRegionsImg from "@/assets/explore-regions.jpg";
import exploreAromasImg from "@/assets/explore-aromas.jpg";

export function ExploreLandingPage() {
  const { data: grapes } = useQuery({
    queryKey: queryKeys.grapes,
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: queryKeys.styleTargets,
    queryFn: () => api.getStyleTargets(),
  });
  const { data: regions } = useQuery({
    queryKey: queryKeys.regions,
    queryFn: () => api.getRegions(),
  });
  const { data: aromaTaxonomy } = useQuery({
    queryKey: queryKeys.aromaTaxonomy,
    queryFn: () => api.getAromaTaxonomy(),
  });

  const descriptorCount =
    aromaTaxonomy?.reduce(
      (acc, s) =>
        acc +
        (s.clusters ?? []).reduce(
          (a, c) => a + (c.descriptors ?? []).length,
          0
        ),
      0
    ) ?? 0;

  const counts = {
    styles: styleTargets?.length ?? 0,
    grapes: grapes?.length ?? 0,
    regions: regions?.length ?? 0,
    aromas: descriptorCount,
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
    <SectionHero
      icon={<Wine className="w-6 h-6 text-wine-light" />}
      eyebrow="Wine Discovery"
      title="Explore Wines"
      subtitle="Choose a path to deepen your understanding of wine. Each category offers curated lessons, tasting guides, and expert insights."
    >
      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <OverlayImageCard
                to={`/explore/${cat.slug}`}
                image={cat.image}
                alt={cat.title}
                label={cat.count}
                title={cat.title}
                subtitle={cat.subtitle}
                description={cat.description}
                ctaText="Start Exploring"
                titleClassName="text-3xl md:text-4xl"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionHero>
  );
}
