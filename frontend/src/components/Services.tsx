import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Scissors, Snowflake, Leaf, TreePine, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { contentApi } from "../services/api";

interface ServicesProps {
  season: 'summer' | 'winter';
}

const summerServices = [
  {
    title: "Precision Lawn Care",
    description: "Weekly maintenance that keeps your lawn looking magazine-ready",
    image: "https://images.unsplash.com/photo-1734303023491-db8037a21f09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBsYW5kc2NhcGluZyUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: Scissors,
    price: "Starting at $45/visit",
    features: ["Professional mowing patterns", "Edge trimming", "Debris removal", "Seasonal scheduling"],
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "Landscape Design",
    description: "Transform your vision into a stunning outdoor reality",
    image: "https://images.unsplash.com/photo-1746458258536-b9ee5db20a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yJTIwbGFuZHNjYXBpbmd8ZW58MXx8fHwxNzU4MjIxMjA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: Leaf,
    price: "Custom pricing",
    features: ["3D design concepts", "Plant selection", "Hardscape installation", "Ongoing maintenance"],
    color: "from-amber-500 to-orange-600"
  }
];

const winterServices = [
  {
    title: "Snow Removal",
    description: "24/7 clearing service that keeps you moving all winter long",
    image: "https://images.unsplash.com/photo-1595391595283-5f057807d054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93JTIwcGxvdyUyMHRydWNrJTIwd2ludGVyfGVufDF8fHx8MTc1ODIyMTIwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: Snowflake,
    price: "Starting at $75/plow",
    features: ["Emergency response", "Salt application", "Sidewalk clearing", "Commercial rates available"],
    color: "from-blue-500 to-indigo-600"
  },
  {
    title: "Ice Management",
    description: "Proactive treatment to prevent dangerous ice formation",
    image: "https://images.unsplash.com/photo-1709668741587-cd18a016493c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3aW50ZXIlMjBzbm93JTIwaG91c2UlMjBkcml2ZXdheXxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: TreePine,
    price: "Seasonal contracts",
    features: ["Pre-treatment application", "Storm monitoring", "Liability protection", "Eco-friendly options"],
    color: "from-slate-500 to-gray-600"
  }
];

export function Services({ season }: ServicesProps) {
  const [summerData, setSummerData] = useState(summerServices);
  const [winterData, setWinterData] = useState(winterServices);

  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>; 
        const sItem = items.find(i => i.key === 'services.summer');
        const wItem = items.find(i => i.key === 'services.winter');
        if (sItem?.value) {
          const parsed = JSON.parse(sItem.value);
          if (Array.isArray(parsed)) setSummerData(parsed);
        }
        if (wItem?.value) {
          const parsed = JSON.parse(wItem.value);
          if (Array.isArray(parsed)) setWinterData(parsed);
        }
      } catch {
        // keep fallbacks
      }
    })();

    // Live updates from admin dashboard via localStorage cache
    const handleUpdateFromCache = () => {
      try {
        const sCached = localStorage.getItem('cache:services.summer');
        const wCached = localStorage.getItem('cache:services.winter');
        if (sCached) setSummerData(JSON.parse(sCached));
        if (wCached) setWinterData(JSON.parse(wCached));
      } catch {}
    };

    const onContentUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.section === 'services' || ce.detail?.persisted) {
        handleUpdateFromCache();
      }
    };
    const onStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'cache:services.summer' || e.key === 'cache:services.winter') {
        handleUpdateFromCache();
      }
    };
    window.addEventListener('content-updated', onContentUpdated);
    window.addEventListener('storage', onStorageUpdate);
    return () => {
      window.removeEventListener('content-updated', onContentUpdated);
      window.removeEventListener('storage', onStorageUpdate);
    };
  }, []);

  const services = season === 'summer' ? summerData : winterData;

  return (
    <section id="services" className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-sm px-4 py-2">
            {season === 'summer' ? '🌱 Summer Services' : '❄️ Winter Services'}
          </Badge>
          <h2 className="text-5xl mb-6 tracking-tight">
            {season === 'summer' ? 'Grow Beautiful Spaces' : 'Winter-Ready Solutions'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {season === 'summer' 
              ? 'Professional lawn care and landscaping services that bring your outdoor vision to life'
              : 'Reliable snow removal and ice management that keeps your property safe and accessible'
            }
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => {
            const IconComp = season === 'summer' ? Leaf : Snowflake;
            const features: string[] = Array.isArray((service as any).features) ? (service as any).features : [];
            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative overflow-hidden rounded-3xl bg-background border hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${(service as any).color || (season === 'summer' ? 'from-green-500 to-emerald-600' : 'from-blue-500 to-indigo-600')} opacity-80`}></div>
                <div className="absolute top-6 left-6">
                  <div className="bg-white/20 backdrop-blur rounded-full p-3">
                    <IconComp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-6 right-6">
                  <Badge className="bg-white/20 backdrop-blur text-white border-white/30">
                    {service.price}
                  </Badge>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-2xl mb-3 tracking-tight">{service.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {features.length > 0 && (
                  <div className="space-y-3 mb-8">
                    {features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button className="w-full group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl mb-4">Need a Custom Solution?</h3>
            <p className="text-muted-foreground mb-6">
              Every property is unique. Let's discuss your specific needs and create a tailored maintenance plan.
            </p>
            <Button size="lg" variant="outline">
              Schedule Consultation
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}