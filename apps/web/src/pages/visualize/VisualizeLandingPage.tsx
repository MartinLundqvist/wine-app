import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { SectionHero } from "@/components/shared/SectionHero";
import { OverlayImageCard } from "@/components/shared/OverlayImageCard";
import vizStructureImg from "@/assets/viz-structure.jpg";
import vizFlavorMapImg from "@/assets/viz-flavor-map.jpg";
import vizClimateImg from "@/assets/viz-climate.jpg";
import vizConfusionImg from "@/assets/viz-confusion.jpg";
import vizAgingImg from "@/assets/viz-aging.jpg";

const visualizations = [
  {
    path: "/visualize/structure",
    title: "Structure Radar",
    description:
      "Compare wine styles on six structural dimensions — acidity, tannin, body, oak, and more. Overlay two styles to see how they differ.",
    image: vizStructureImg,
  },
  {
    path: "/visualize/flavor-map",
    title: "Flavor Direction Map",
    description:
      "Plot styles on a 2D map from fruit-driven to earth/herb, and from red to black fruit (or citrus to tropical for whites).",
    image: vizFlavorMapImg,
  },
  {
    path: "/visualize/climate",
    title: "Climate Gradient Explorer",
    description:
      "See how styles sit along a cool-to-warm climate gradient and explore how structure changes with climate.",
    image: vizClimateImg,
  },
  {
    path: "/visualize/confusion",
    title: "Confusion Zone",
    description:
      "Discover which styles are most easily confused with each other and learn how to tell them apart.",
    image: vizConfusionImg,
  },
  {
    path: "/visualize/aging",
    title: "Aging Simulator",
    description:
      "Watch how structure and aromas evolve from young to developing to mature for any style.",
    image: vizAgingImg,
  },
];

export function VisualizeLandingPage() {
  const [featured, ...rest] = visualizations;

  return (
    <SectionHero
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
      eyebrow="Interactive Tools"
      title="Visualize Wines"
      subtitle="Interact with data-driven visualizations that reveal the hidden structure, flavor geography, and evolution of wine styles."
      backTo={{ path: "/", label: "Back to Home" }}
    >
      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <OverlayImageCard
            to={featured.path}
            image={featured.image}
            alt={featured.title}
            variant="featured"
            label="Featured"
            title={featured.title}
            description={featured.description}
            ctaText="Launch Tool"
            lazy={false}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((viz, index) => (
            <motion.div
              key={viz.path}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <OverlayImageCard
                to={viz.path}
                image={viz.image}
                alt={viz.title}
                title={viz.title}
                description={viz.description}
                ctaText="Launch Tool"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionHero>
  );
}
