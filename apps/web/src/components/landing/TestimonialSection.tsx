import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TestimonialSection = () => {
  return (
    <section id="testimonials" className="py-24 md:py-32 bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Quote className="w-10 h-10 text-primary/30 mx-auto mb-8" />
          <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed mb-8 italic">
            &quot;Sommelier transformed how I experience wine. What used to be a casual interest is now a deep,
            enriching passion that connects me to cultures and traditions around the world.&quot;
          </blockquote>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">
              Isabelle Laurent
            </p>
            <p className="text-sm text-muted-foreground font-sans">
              WSET Level 3 Graduate · Paris, France
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialSection;
