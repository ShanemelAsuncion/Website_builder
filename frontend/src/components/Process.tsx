import { Badge } from "./ui/badge";
import { MessageSquare, Calendar, Wrench, Star } from "lucide-react";
import { motion } from "motion/react";

interface ProcessProps {
  season: 'summer' | 'winter';
}

const steps = [
  {
    icon: MessageSquare,
    title: "Consultation",
    description: "We start with understanding your needs and property requirements",
    details: "Free estimate • Property assessment • Custom recommendations"
  },
  {
    icon: Calendar,
    title: "Scheduling",
    description: "Flexible scheduling that works with your timeline and budget",
    details: "Weekly/monthly plans • Seasonal contracts • Emergency services"
  },
  {
    icon: Wrench,
    title: "Execution",
    description: "Professional service delivery with attention to every detail",
    details: "Licensed professionals • Modern equipment • Quality guarantee"
  },
  {
    icon: Star,
    title: "Follow-up",
    description: "Ongoing communication and service optimization",
    details: "Progress updates • Satisfaction checks • Seasonal adjustments"
  }
];

export function Process({ season }: ProcessProps) {
  return (
    <section id="process" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-sm px-4 py-2">
            How We Work
          </Badge>
          <h2 className="text-5xl mb-6 tracking-tight">
            Simple Process, Outstanding Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From initial consultation to ongoing maintenance, we make property care effortless for you
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl mb-3 tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {step.description}
                </p>
                <div className="text-sm text-muted-foreground/80">
                  {step.details}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-border to-transparent transform translate-x-4"></div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 grid lg:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <div className="text-3xl mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Properties Maintained</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <div className="text-3xl mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <div className="text-3xl mb-2">99.8%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}