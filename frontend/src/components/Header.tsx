import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Menu, Phone, Leaf, Snowflake } from "lucide-react";
import { contentApi, resolveAssetUrl } from "../services/api";

interface HeaderProps {
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
}
export function Header({ season, onSeasonToggle }: HeaderProps) {
  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  const [phone, setPhone] = useState<string>("(555) 123-4567");
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string }>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>;
        const cItem = items.find(i => i.key === 'contact');
        if (cItem?.value) {
          const parsed = JSON.parse(cItem.value) as { phone?: string };
          if (parsed.phone) setPhone(parsed.phone);
        }
        const bItem = items.find(i => i.key === 'branding');
        if (bItem?.value) {
          try {
            setBranding(JSON.parse(bItem.value));
          } catch {}
        }
      } catch {}
    })();
    // Initialize from localStorage cache if present
    try {
      const cachedContact = localStorage.getItem('cache:contact');
      const cachedBranding = localStorage.getItem('cache:branding');
      if (cachedContact) {
        const c = JSON.parse(cachedContact);
        if (c?.phone) setPhone(c.phone);
      }
      if (cachedBranding) {
        const b = JSON.parse(cachedBranding);
        setBranding(b || {});
      }
    } catch {}

    const refreshFromCache = () => {
      try {
        const cachedContact = localStorage.getItem('cache:contact');
        const cachedBranding = localStorage.getItem('cache:branding');
        if (cachedContact) {
          const c = JSON.parse(cachedContact);
          if (c?.phone) setPhone(c.phone);
        }
        if (cachedBranding) {
          const b = JSON.parse(cachedBranding);
          setBranding(b || {});
        }
      } catch {}
    };
    const onContentUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.persisted) refreshFromCache();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cache:contact' || e.key === 'cache:branding') refreshFromCache();
    };
    window.addEventListener('content-updated', onContentUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('content-updated', onContentUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b">
      <div className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center gap-3">
                {branding.logoUrl && (
                  <img
                    src={resolveAssetUrl(branding.logoUrl)}
                    alt={branding.name || 'Company Logo'}
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 object-contain"
                  />
                )}
                <h1 className="text-xl sm:text-2xl md:text-3xl tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {branding.name || "Jay's Blade & Snow Services Inc"}
                  </span>
                </h1>
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12 text-sm xl:text-base">
            <a href="#services" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Services</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a href="#work" className="relative group">
              <span className="hover:text-primary transition-colors duration-300">Portfolio</span>
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
            <div className="hidden lg:flex items-center space-x-4">
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
            
            <div className="hidden lg:flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>{phone}</span>
            </div>
            
            <Button onClick={scrollToContact} className="hidden xl:block bg-primary hover:bg-primary/90 btn-quote">
              Get Quote
            </Button>
            
            <Button variant="outline" size="sm" className="lg:hidden" aria-expanded={mobileOpen} aria-controls="mobile-menu" onClick={() => setMobileOpen(v => !v)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileOpen && (
          <div id="mobile-menu" className="lg:hidden mt-4 border rounded-xl bg-background shadow-md">
            <div className="p-4 grid gap-2 justify-items-center">
              <a href="#services" className="block w-full text-center py-2 rounded-md hover:bg-muted hover:text-primary" onClick={() => setMobileOpen(false)}>Services</a>
              <a href="#work" className="block w-full text-center py-2 rounded-md hover:bg-muted hover:text-primary" onClick={() => setMobileOpen(false)}>Portfolio</a>
              <a href="#process" className="block w-full text-center py-2 rounded-md hover:bg-muted hover:text-primary" onClick={() => setMobileOpen(false)}>Process</a>
              <a href="#testimonials" className="block w-full text-center py-2 rounded-md hover:bg-muted hover:text-primary" onClick={() => setMobileOpen(false)}>Reviews</a>
              <a href="#contact" className="block w-full text-center py-2 rounded-md hover:bg-muted hover:text-primary" onClick={() => { setMobileOpen(false); scrollToContact(); }}>Contact</a>
              {/* Seasonal toggle inside dropdown for small/medium screens */}
              <div className="flex items-center justify-center gap-3 w-full py-2">
                <Leaf className={`h-4 w-4 ${season === 'summer' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <Switch checked={season === 'winter'} onCheckedChange={(_checked: boolean) => { onSeasonToggle(); }} />
                <Snowflake className={`h-4 w-4 ${season === 'winter' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>
              {/* Call section collapsed into dropdown */}
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 w-full justify-center text-sm py-2 rounded-md hover:bg-muted hover:text-primary">
                <Phone className="h-4 w-4 text-primary" />
                <span>{phone}</span>
              </a>
              <Button onClick={() => { setMobileOpen(false); scrollToContact(); }} className="w-full bg-primary hover:bg-primary/90">Get Quote</Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;