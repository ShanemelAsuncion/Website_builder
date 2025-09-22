import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ArrowRight } from "lucide-react";
import { contentApi } from "../services/api";

interface FooterProps {
  season: 'summer' | 'winter';
}

export function Footer({ season }: FooterProps) {
  const [contactInfo, setContactInfo] = useState<{ phone: string; email: string; address: string; hours?: string; weekendNote?: string }>({
    phone: '(555) 123-4567',
    email: 'info@proseason.com',
    address: 'Greater Metro Area',
  });
  const [services, setServices] = useState<Array<{ title: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>;
        const cItem = items.find(i => i.key === 'contact');
        if (cItem?.value) {
          const parsed = JSON.parse(cItem.value) as { phone?: string; email?: string; address?: string; hours?: string; weekendNote?: string };
          setContactInfo(prev => ({
            phone: parsed.phone || prev.phone,
            email: parsed.email || prev.email,
            address: parsed.address || prev.address,
            hours: parsed.hours || prev.hours,
            weekendNote: parsed.weekendNote || prev.weekendNote,
          }));
        }
        const sSummer = items.find(i => i.key === 'services.summer');
        const sWinter = items.find(i => i.key === 'services.winter');
        const summerArr = sSummer?.value ? JSON.parse(sSummer.value) : [];
        const winterArr = sWinter?.value ? JSON.parse(sWinter.value) : [];
        const merged = ([] as any[]).concat(Array.isArray(summerArr) ? summerArr : [], Array.isArray(winterArr) ? winterArr : []);
        setServices(merged);
      } catch {
        // keep fallbacks
      }
    })();
  }, []);


  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-3xl tracking-tight">ProSeason</h3>
              <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
            </div>
            <p className="text-primary-foreground/80 mb-6 text-lg leading-relaxed max-w-md">
              Professional property maintenance that adapts to every season. From pristine lawns to safe winter paths.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                Licensed & Insured
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                24/7 Emergency
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                15+ Years Experience
              </Badge>
            </div>
            <Button onClick={scrollToContact} variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Emergency Service
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div>
            <h4 className="text-lg mb-6">All Services</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              {services.length > 0 ? (
                services.map((s, i) => (
                  <li key={i} className="hover:text-primary-foreground transition-colors cursor-pointer">
                    <a href="#services" className="hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))
              ) : (
                <>
                  <li className="hover:text-primary-foreground transition-colors cursor-pointer"><a href="#services" className="hover:underline">Service 1</a></li>
                  <li className="hover:text-primary-foreground transition-colors cursor-pointer"><a href="#services" className="hover:underline">Service 2</a></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-lg mb-6">Connect</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li>{contactInfo.phone}</li>
              <li>{contactInfo.email}</li>
              <li>{contactInfo.hours || 'Mon-Fri: 7AM-6PM'}</li>
              <li>{contactInfo.weekendNote || 'Emergency: 24/7'}</li>
            </ul>
            
            <div className="mt-8">
              <h5 className="text-sm mb-3 text-primary-foreground/60">SERVICE AREAS</h5>
              <p className="text-sm text-primary-foreground/80">
                {contactInfo.address} • 50+ Mile Radius • Commercial & Residential
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-primary-foreground/20" />
        
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 ProSeason. All rights reserved. • Professional property maintenance services.
          </p>
          <div className="flex space-x-8 text-sm text-primary-foreground/60 mt-4 lg:mt-0">
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Insurance</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Careers</a>
          </div>
        </div>
      </div>
    </footer>
  );
}