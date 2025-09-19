import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";

interface TestimonialsProps {
  season: 'summer' | 'winter';
}

const summerTestimonials = [
  {
    name: "Sarah Johnson",
    role: "Homeowner",
    initials: "SJ",
    rating: 5,
    text: "ProSeason transformed our backyard into something out of a magazine. The weekly maintenance keeps everything looking perfect, and their attention to detail is incredible.",
    highlight: "Transformed our backyard"
  },
  {
    name: "Marcus Williams",
    role: "Property Manager",
    initials: "MW",
    rating: 5,
    text: "Managing 12 commercial properties, I need reliable service. ProSeason's landscaping team consistently delivers professional results that impress our tenants.",
    highlight: "Consistently professional"
  },
  {
    name: "Jennifer Chen",
    role: "Garden Enthusiast",
    initials: "JC",
    rating: 5,
    text: "Their plant selection expertise saved my struggling garden. Now it's the neighborhood showcase, and I've learned so much from their team.",
    highlight: "Neighborhood showcase"
  }
];

const winterTestimonials = [
  {
    name: "David Rodriguez",
    role: "Business Owner",
    initials: "DR",
    rating: 5,
    text: "During the last blizzard, they had our parking lot cleared by 5 AM. Our customers could shop safely, and we didn't lose a day of business.",
    highlight: "Never lost a day"
  },
  {
    name: "Lisa Thompson",
    role: "Senior Community",
    initials: "LT",
    rating: 5,
    text: "Safety is our top priority. ProSeason's ice management keeps our walkways safe for residents, and their emergency response is outstanding.",
    highlight: "Outstanding response"
  },
  {
    name: "Robert Kim",
    role: "Facility Director",
    initials: "RK",
    rating: 5,
    text: "Three years of winter contracts, and they've never let us down. Professional, reliable, and their equipment is always well-maintained.",
    highlight: "Never let us down"
  }
];

export function Testimonials({ season }: TestimonialsProps) {
  const testimonials = season === 'summer' ? summerTestimonials : winterTestimonials;

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-sm px-4 py-2">
            Customer Stories
          </Badge>
          <h2 className="text-5xl mb-6 tracking-tight">
            Trusted by Property Owners
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from customers who trust us with their most important spaces
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-background rounded-3xl p-8 border hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <Quote className="h-6 w-6 text-primary/30" />
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="pt-4 border-t border-border">
                  <Badge variant="secondary" className="text-xs">
                    {testimonial.highlight}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-primary rounded-3xl p-8 text-primary-foreground max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="text-4xl mb-2">500+</div>
                <div className="text-primary-foreground/80">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">4.9/5</div>
                <div className="text-primary-foreground/80">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">15+</div>
                <div className="text-primary-foreground/80">Years Trusted</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}