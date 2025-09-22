import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Calendar, MapPin, ArrowRight, ExternalLink, Star, Clock } from "lucide-react";
import { motion } from "motion/react";
import { contentApi } from "../services/api";

interface WorkProps {
  season: 'summer' | 'winter';
}

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  duration: string;
  category: string;
  featured?: boolean;
}


export function Work({ season }: WorkProps) {
  const [summerData, setSummerData] = useState<Project[]>([]);
  const [winterData, setWinterData] = useState<Project[]>([]);
  const [facebookUrl, setFacebookUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>; 
        const sItem = items.find(i => i.key === 'portfolio.summer');
        const wItem = items.find(i => i.key === 'portfolio.winter');
        const cItem = items.find(i => i.key === 'contact');
        if (sItem?.value) {
          const parsed = JSON.parse(sItem.value) as Array<Project>;
          setSummerData(parsed);
        }
        if (wItem?.value) {
          const parsed = JSON.parse(wItem.value) as Array<Project>;
          setWinterData(parsed);
        }
        if (cItem?.value) {
          try {
            const parsed = JSON.parse(cItem.value) as { facebook?: string; facebookUrl?: string };
            const raw = parsed.facebookUrl || parsed.facebook;
            if (raw) setFacebookUrl(raw.startsWith('http') ? raw : `https://facebook.com/${raw}`);
          } catch {}
        }
      } catch (e) {
        // Keep fallbacks
      }
    })();
    // Function to update state from localStorage cache
    const handleUpdateFromCache = () => {
      try {
        const cachedSummer = localStorage.getItem('cache:portfolio.summer');
        const cachedWinter = localStorage.getItem('cache:portfolio.winter');
        if (cachedSummer) {
          const items = JSON.parse(cachedSummer) as Array<Project>;
          setSummerData(items);
        }
        if (cachedWinter) {
          const items = JSON.parse(cachedWinter) as Array<Project>;
          setWinterData(items);
        }
      } catch {}
    };

    // Live updates from admin dashboard (same tab)
    const onContentUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.section === 'portfolio' || ce.detail?.persisted) {
        handleUpdateFromCache();
      }
    };

    // Live updates from admin dashboard (cross-tab)
    const onStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'cache:portfolio.summer' || e.key === 'cache:portfolio.winter') {
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

  const projects = season === 'summer' ? summerData : winterData;

  if (projects.length === 0) {
    // Render a loading state or nothing while data is being fetched
    return null;
  }

  const featuredProject = projects.find(p => p.featured);
  const otherProjects = featuredProject
    ? projects.filter(p => p.id !== featuredProject.id)
    : projects;

  return (
    <section id="work" className="py-24 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-sm px-4 py-2">
            {season === 'summer' ? '🌱 Summer Portfolio' : '❄️ Winter Portfolio'}
          </Badge>
          <h2 className="text-5xl mb-6 tracking-tight">
            {season === 'summer' ? 'Transformation Gallery' : 'Winter Solutions'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {season === 'summer' 
              ? 'Discover how we transform ordinary spaces into extraordinary outdoor experiences through expert design and meticulous care'
              : 'See how we keep properties safe and accessible through the harshest winter conditions with professional snow and ice management'
            }
          </p>
        </motion.div>

        {/* Featured Project (only if exists) */}
        {featuredProject && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
          >
            <div className="bg-background rounded-3xl overflow-hidden border shadow-xl">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative h-80 lg:h-auto overflow-hidden">
                  <ImageWithFallback 
                    src={featuredProject.imageUrl} 
                    alt={featuredProject.title} 
                    className="w-full h-full object-cover rounded-3xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-primary text-primary-foreground">
                      Featured Project
                    </Badge>
                  </div>
                  <div className="absolute bottom-6 right-6">
                    <div className="flex items-center space-x-1 bg-black/50 backdrop-blur rounded-full px-3 py-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-sm">5.0</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <Badge variant="secondary" className="w-fit mb-4">
                    {featuredProject.category}
                  </Badge>
                  <h3 className="text-3xl mb-4 tracking-tight">{featuredProject.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                    {featuredProject.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">{featuredProject.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">{featuredProject.duration}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-fit group">
                    View Case Study
                    <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Gallery */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {otherProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-background border hover:shadow-xl transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback 
                  src={project.imageUrl} 
                  alt={project.title} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur text-foreground">
                    {project.category}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <Button size="sm" variant="outline" className="w-full bg-background/90 backdrop-blur border-background/50">
                    View Details
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg mb-2 tracking-tight group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{project.duration}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-primary rounded-3xl p-12 text-primary-foreground"
        >
          <h3 className="text-3xl mb-4 tracking-tight">Want to view more of our work?</h3>
          <p className="text-primary-foreground/80 mb-8 text-lg max-w-2xl mx-auto">
            Explore more recent projects and updates on our Facebook page.
          </p>
          {facebookUrl && (
            <div className="flex justify-center">
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  View more on Facebook
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}