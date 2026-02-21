import { motion } from "framer-motion";
import heroImage from "@/assets/hero-wine.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Wine cellar with a glass of red wine on an oak barrel"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-70" />
        <div className="absolute inset-0 bg-cellar/40" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-oak-light font-sans text-sm tracking-[0.3em] uppercase mb-6"
        >
          The Language of Wine
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-[1.1] mb-6"
        >
          Discover the
          <br />
          <span className="italic font-normal text-oak-light">Language</span> of
          Wine
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-cream-dark/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed"
        >
          Master the art of understanding wine.
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;
