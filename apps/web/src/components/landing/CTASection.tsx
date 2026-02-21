import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const CTASection = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm tracking-[0.25em] uppercase text-oak-light mb-4 font-sans">
            Start Today
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-6 leading-tight">
            Your Wine Journey
            <br />
            <span className="italic font-normal">Awaits</span>
          </h2>
          <p className="text-cream-dark/70 text-lg mb-10 font-light leading-relaxed max-w-xl mx-auto">
            Join thousands of wine lovers who have deepened their appreciation
            and knowledge through our expertly crafted courses.
          </p>
          <Button variant="hero" size="lg" className="px-12 py-6">
            Begin Your Journey
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
