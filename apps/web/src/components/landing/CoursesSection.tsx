import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import wineTasting from "@/assets/wine-tasting.jpg";
import vineyard from "@/assets/vineyard.jpg";
import wineCellar from "@/assets/wine-cellar.jpg";

const courses = [
  {
    image: wineTasting,
    tag: "Beginner",
    title: "Foundations of Wine Tasting",
    description: "Learn to identify aromas, flavors, and structure in every glass.",
    lessons: 12,
    duration: "4 weeks",
  },
  {
    image: vineyard,
    tag: "Intermediate",
    title: "Regions & Terroir",
    description: "Explore how geography, climate, and soil shape the character of wine.",
    lessons: 18,
    duration: "6 weeks",
  },
  {
    image: wineCellar,
    tag: "Advanced",
    title: "Cellar & Collection",
    description: "Master the art of wine selection, storage, and building a personal collection.",
    lessons: 15,
    duration: "5 weeks",
  },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-sans">
            Learning Paths
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            Curated Courses
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl mb-5 aspect-[4/3]">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-cellar/20 group-hover:bg-cellar/10 transition-colors duration-500" />
                <span className="absolute top-4 left-4 text-xs font-sans tracking-wider uppercase bg-background/90 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full">
                  {course.tag}
                </span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {course.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-sans">
                  {course.lessons} lessons · {course.duration}
                </span>
                <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
