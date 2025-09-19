import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import { contentApi } from "../services/api";

interface TestimonialsProps {
  season: 'summer' | 'winter';
}

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  rating: number;
  text: string;
  highlight: string;
}


export function Testimonials({ season }: TestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>; 
        const tItem = items.find((i) => i.key === 'testimonials');
        if (tItem?.value) {
          const parsed = JSON.parse(tItem.value) as Array<{
            id?: string;
            name: string;
            role: string;
            rating: number;
            comment: string;
          }>;
          // Map admin schema to UI schema
          const mapped = parsed.map((t) => {
            const initials = t.name
              ? t.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join('')
              : 'CU';
            return {
              name: t.name || 'Customer',
              role: t.role || 'Customer',
              initials,
              rating: Math.max(1, Math.min(5, Number(t.rating) || 5)),
              text: t.comment || '',
              highlight: 'Verified feedback'
            };
          });
          setTestimonials(mapped);
        }
      } catch (e) {
        // On error, show an empty list
        setTestimonials([]);
      }
    })();

    // Function to update state from localStorage cache
    const handleUpdateFromCache = () => {
      try {
        const cached = localStorage.getItem('cache:testimonials');
        if (cached) {
          const parsed = JSON.parse(cached) as Array<{ name: string; role: string; rating: number; comment: string }>;
          const mapped = parsed.map((t) => {
            const initials = t.name ? t.name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') : 'CU';
            return {
              name: t.name || 'Customer',
              role: t.role || 'Customer',
              initials,
              rating: Math.max(1, Math.min(5, Number(t.rating) || 5)),
              text: t.comment || '',
              highlight: 'Verified feedback'
            };
          });
          setTestimonials(mapped);
        }
      } catch {}
    };

    // Live updates from admin dashboard (same tab)
    const onContentUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.section === 'testimonials' || ce.detail?.persisted) {
        handleUpdateFromCache();
      }
    };

    // Live updates from admin dashboard (cross-tab)
    const onStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'cache:testimonials') {
        handleUpdateFromCache();
      }
    };

    window.addEventListener('content-updated', onContentUpdated);
    window.addEventListener('storage', onStorageUpdate);

    return () => {
      window.removeEventListener('content-updated', onContentUpdated);
      window.removeEventListener('storage', onStorageUpdate);
    };
  }, [season]);

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