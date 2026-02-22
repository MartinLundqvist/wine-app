import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Radar,
  MapPin,
  ThermometerSun,
  GitCompare,
  Clock,
  BarChart3,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import { ExplorePageShell } from "@/components/explore/ExplorePageShell";

const tools = [
  {
    path: "/visualize/structure",
    title: "Structure Radar",
    description:
      "Compare wine styles on six structural dimensions — acidity, tannin, body, oak, and more. Overlay two styles to see how they differ.",
    icon: Radar,
  },
  {
    path: "/visualize/flavor-map",
    title: "Flavor Direction Map",
    description:
      "Plot styles on a 2D map from fruit-driven to earth/herb, and from red to black fruit (or citrus to tropical for whites).",
    icon: MapPin,
  },
  {
    path: "/visualize/climate",
    title: "Climate Gradient Explorer",
    description:
      "See how styles sit along a cool-to-warm climate gradient and explore how structure changes with climate.",
    icon: ThermometerSun,
  },
  {
    path: "/visualize/confusion",
    title: "Confusion Zone",
    description:
      "Discover which styles are most easily confused with each other and learn how to tell them apart.",
    icon: GitCompare,
  },
  {
    path: "/visualize/aging",
    title: "Aging Simulator",
    description:
      "Watch how structure and aromas evolve from young to developing to mature for any style.",
    icon: Clock,
  },
];

export function VisualizeLandingPage() {
  return (
    <ExplorePageShell
      sectionLabel="Visualize"
      title="Wine Visualizations"
      subtitle="Interactive tools to explore structure, flavor direction, climate, and aging. Compare styles side by side and see small differences clearly."
      icon={<BarChart3 className="w-6 h-6 text-wine-light" />}
    >
      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.06 }}
            >
              <Link
                to={tool.path}
                className="group block rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-wine hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-wine-deep/10 text-wine-deep group-hover:bg-wine-deep/20 transition-colors">
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    {tool.title}
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center gap-2 text-primary font-sans text-sm font-medium group-hover:gap-3 transition-all duration-300">
                  Open tool
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </ExplorePageShell>
  );
}
