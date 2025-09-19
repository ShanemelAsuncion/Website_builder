import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Calendar, MapPin, ArrowRight, ExternalLink, Star } from "lucide-react";
import { motion } from "motion/react";

interface WorkProps {
  season: 'summer' | 'winter';
}

const summerProjects = [
  {
    title: "Modern Estate Transformation",
    location: "Westfield Heights",
    date: "Summer 2024",
    image: "https://images.unsplash.com/photo-1622015663084-307d19eabbbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob21lJTIwbGFuZHNjYXBpbmd8ZW58MXx8fHwxNzU4MjI3MjM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Complete landscape redesign featuring native plantings, water features, and sustainable hardscaping for a 2-acre estate.",
    category: "Luxury Design",
    duration: "6 weeks",
    featured: true
  },
  {
    title: "Garden Sanctuary Design",
    location: "Downtown District",
    date: "Spring 2024", 
    image: "https://images.unsplash.com/photo-1677275968967-7d1506282323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBsYW5kc2NhcGluZyUyMGdhcmRlbiUyMGRlc2lnbnxlbnwxfHx8fDE3NTgyMjExNTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Urban oasis creation with vertical gardens, sustainable irrigation, and year-round blooming schedule.",
    category: "Garden Design",
    duration: "4 weeks"
  },
  {
    title: "Modern Patio & Pergola",
    location: "Riverside Community",
    date: "Summer 2024",
    image: "https://images.unsplash.com/photo-1696100873900-a870b5d29e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnYXJkZW4lMjBkZXNpZ24lMjBwYXRpb3xlbnwxfHx8fDE3NTgyMjcyNDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Contemporary outdoor living space with custom pergola, integrated lighting, and low-maintenance landscaping.",
    category: "Hardscaping",
    duration: "3 weeks"
  },
  {
    title: "Lawn Revitalization Project",
    location: "North Hills",
    date: "Summer 2024",
    image: "https://images.unsplash.com/photo-1756428785435-c3a6b74147d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWZvcmUlMjBhZnRlciUyMGxhd24lMjB0cmFuc2Zvcm1hdGlvbnxlbnwxfHx8fDE3NTgyMjcyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Complete lawn renovation including soil amendment, new sod installation, and automated irrigation system.",
    category: "Lawn Care",
    duration: "2 weeks"
  }
];

const winterProjects = [
  {
    title: "Commercial Snow Management",
    location: "Business Park Complex",
    date: "Winter 2023-24",
    image: "https://images.unsplash.com/photo-1679965101443-72ba40f7dec8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwcHJvcGVydHklMjB3aW50ZXIlMjBtYWludGVuYW5jZXxlbnwxfHx8fDE3NTgyMjcyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "24/7 snow removal and ice management for 50+ commercial properties ensuring zero downtime during winter storms.",
    category: "Commercial",
    duration: "Seasonal",
    featured: true
  },
  {
    title: "Residential Driveway Clearing",
    location: "Suburban Districts",
    date: "Winter 2023-24",
    image: "https://images.unsplash.com/photo-1674049406206-83d38bd15c8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93JTIwcGxvdyUyMGNsZWFyaW5nJTIwZHJpdmV3YXl8ZW58MXx8fHwxNzU4MjI3MjQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Emergency response snow clearing for residential customers with 2-hour guarantee during storm events.",
    category: "Emergency Service",
    duration: "On-demand"
  },
  {
    title: "HOA Winter Maintenance",
    location: "Mountain View Community",
    date: "Winter 2023-24",
    image: "https://images.unsplash.com/photo-1595391595283-5f057807d054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93JTIwcGxvdyUyMHRydWNrJTIwd2ludGVyfGVufDF8fHx8MTc1ODIyMTIwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Comprehensive winter maintenance program for 200-unit community including sidewalks, parking, and common areas.",
    category: "HOA Contract",
    duration: "Seasonal"
  },
  {
    title: "Ice Management Systems",
    location: "Downtown Core",
    date: "Winter 2023-24",
    image: "https://images.unsplash.com/photo-1709668741587-cd18a016493c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3aW50ZXIlMjBzbm93JTIwaG91c2UlMjBkcml2ZXdheXxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Proactive ice prevention and treatment for high-traffic commercial walkways and entrance areas.",
    category: "Ice Management",
    duration: "Ongoing"
  }
];

export function Work({ season }: WorkProps) {
  const projects = season === 'summer' ? summerProjects : winterProjects;
  const featuredProject = projects.find(p => p.featured) || projects[0];
  const otherProjects = projects.filter(p => !p.featured);

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

        {/* Featured Project */}
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
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover"
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
                    <Calendar className="h-5 w-5 text-primary" />
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
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                    <Calendar className="h-3 w-3" />
                    <span>{project.date}</span>
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
          <h3 className="text-3xl mb-4 tracking-tight">Ready to Start Your Project?</h3>
          <p className="text-primary-foreground/80 mb-8 text-lg max-w-2xl mx-auto">
            {season === 'summer' 
              ? 'Transform your outdoor space into the landscape of your dreams. Every project is unique, and we bring the same attention to detail to properties of all sizes.'
              : 'Ensure your property stays safe and accessible all winter long. From residential driveways to commercial complexes, we have the expertise and equipment to handle any challenge.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              View Full Portfolio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              Schedule Consultation
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}