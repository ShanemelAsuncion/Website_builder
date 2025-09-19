import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Menu, Phone, Leaf, Snowflake } from "lucide-react";

interface HeaderProps {
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
}

export function Header({ season, onSeasonToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b">
      <div className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <h1 className="text-3xl tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ProSeason
                </span>
              </h1>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-12">
            <a href="#services" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Services</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a href="#process" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Process</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a href="#testimonials" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Reviews</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a href="#contact" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Contact</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
          </nav>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-sm">
                <Leaf className={`h-4 w-4 transition-colors duration-300 ${season === 'summer' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <Switch 
                  checked={season === 'winter'} 
                  onCheckedChange={onSeasonToggle}
                  className="data-[state=checked]:bg-blue-500"
                />
                <Snowflake className={`h-4 w-4 transition-colors duration-300 ${season === 'winter' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>(555) 123-4567</span>
            </div>
            
            <Button className="hidden md:block bg-primary hover:bg-primary/90">
              Get Quote
            </Button>
            
            <Button variant="outline" size="sm" className="lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}