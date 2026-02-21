import { motion } from "framer-motion";
import { GlassWater, BookOpen, Users, Award } from "lucide-react";

const features = [
  {
    icon: GlassWater,
    title: "Guided Tastings",
    description: "Develop your palate with structured blind tasting exercises and detailed flavor profiles.",
  },
  {
    icon: BookOpen,
    title: "Expert Curriculum",
    description: "Study from WSET-aligned content covering Old World, New World, and emerging wine regions.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow wine enthusiasts and participate in live virtual tasting events.",
  },
  {
    icon: Award,
    title: "Certification",
    description: "Earn recognized credentials that demonstrate your wine knowledge and tasting ability.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const FeaturesSection = () => {
  return (
    <section id="about" className="py-24 md:py-32 bg-gradient-warm">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-sans">
            Why Sommelier
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            A New Way to Learn Wine
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-8 rounded-2xl bg-card hover:shadow-wine transition-all duration-500 border border-border/50"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
