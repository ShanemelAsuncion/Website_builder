import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  season: 'summer' | 'winter';
}

export function Hero({ season }: HeroProps) {
  const summerContent = {
    title: "Transform Your Outdoor Space",
    subtitle: "Professional lawn care that brings your property to life",
    image: "https://images.unsplash.com/photo-1746458258536-b9ee5db20a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yJTIwbGFuZHNjYXBpbmd8ZW58MXx8fHwxNzU4MjIxMjA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gradient: "from-green-600/80 to-emerald-700/80"
  };

  const winterContent = {
    title: "Clear Paths, Safe Spaces",
    subtitle: "Reliable snow removal when you need it most",
    image: "https://images.unsplash.com/photo-1709668741587-cd18a016493c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBzbm93JTIwaG91c2UlMjBkcml2ZXdheXxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gradient: "from-blue-600/80 to-slate-700/80"
  };

  const content = season === 'summer' ? summerContent : winterContent;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <motion.div 
        key={season}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
      >
        <ImageWithFallback
          src={content.image}
          alt={season === 'summer' ? 'Modern landscaped home' : 'Winter home with snow'}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${content.gradient}`}></div>
      </motion.div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            key={`${season}-content`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                {season === 'summer' ? '🌱 Growing Season' : '❄️ Winter Ready'}
              </div>
              <h1 className="text-6xl lg:text-7xl leading-tight tracking-tight">
                {content.title}
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 max-w-lg">
                {content.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10">
                <Play className="mr-2 h-5 w-5" />
                Watch Process
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl">500+</div>
                <div className="text-sm text-white/70">Projects Completed</div>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl">15+</div>
                <div className="text-sm text-white/70">Years Experience</div>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl">24/7</div>
                <div className="text-sm text-white/70">Emergency Service</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            key={`${season}-image`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-xl">Current Status</h3>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-white/80">
                      <span>Active Projects</span>
                      <span>12</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Response Time</span>
                      <span>&lt; 2 hours</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Satisfaction Rate</span>
                      <span>99.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}