import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import axios from 'axios';
import { contentApi } from "../services/api";

interface ContactProps {
  season: 'summer' | 'winter';
}

export function Contact({ season }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const [contactInfo, setContactInfo] = useState<{ phone: string; email: string; address: string; hours?: string; weekendNote?: string }>({
    phone: '(555) 123-4567',
    email: 'info@proseason.com',
    address: 'Greater Metro Area',
  });

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
      } catch {
        // keep fallbacks
      }
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleServiceChange = (value: string) => {
    setFormData(prev => ({ ...prev, service: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMsg('');

    try {
      const response = await axios.post<{ message: string }>('http://localhost:5000/api/contact', formData);
      setStatus('success');
      setResponseMsg(response.data.message);
      setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    } catch (error: any) {
      setStatus('error');
      setResponseMsg(error.response?.data?.error || 'An unexpected error occurred.');
    }
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-sm px-4 py-2">
            Get Started Today
          </Badge>
          <h2 className="text-5xl mb-6 tracking-tight">
            Ready to Transform Your Property?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get a personalized quote in 24 hours. No pressure, just professional advice tailored to your needs.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            <div>
              <h3 className="text-2xl mb-6 tracking-tight">Let's Connect</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contactInfo.phone}</div>
                    <div className="text-sm text-muted-foreground">{contactInfo.weekendNote || 'Available 24/7 for emergencies'}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contactInfo.email}</div>
                    <div className="text-sm text-muted-foreground">Response within 2 hours</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contactInfo.address}</div>
                    <div className="text-sm text-muted-foreground">50+ mile service radius</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contactInfo.hours || 'Mon-Fri: 7AM-6PM'}</div>
                    <div className="text-sm text-muted-foreground">{contactInfo.weekendNote || 'Weekend emergency service'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-6">
              <h4 className="font-medium mb-4">Why Choose ProSeason?</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Licensed & insured professionals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">100% satisfaction guarantee</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Modern equipment & eco-friendly options</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Flexible scheduling & emergency response</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="bg-background rounded-3xl p-8 border shadow-xl">
              <div className="mb-8">
                <h3 className="text-2xl mb-2 tracking-tight">Get Your Free Quote</h3>
                <p className="text-muted-foreground">
                  Tell us about your property and we'll provide a detailed estimate within 24 hours
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" className="h-12" value={formData.name} onChange={handleInputChange} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="h-12" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" className="h-12" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service Needed</Label>
                  <Select onValueChange={handleServiceChange} value={formData.service}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="What service are you interested in?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lawn-care">Lawn Care & Maintenance</SelectItem>
                      <SelectItem value="snow-removal">Snow Removal & Plowing</SelectItem>
                      <SelectItem value="landscaping">Landscape Design</SelectItem>
                      <SelectItem value="ice-management">Ice Management</SelectItem>
                      <SelectItem value="multiple">Multiple Services</SelectItem>
                      <SelectItem value="consultation">Free Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your property size, specific needs, timeline, or any questions you have..."
                    rows={4}
                    className="resize-none"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-base group" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /> Send Quote Request</>
                  )}
                </Button>
                
                {status === 'success' && (
                  <div className="text-green-600 bg-green-50 p-3 rounded-md text-center">
                    {responseMsg}
                  </div>
                )}
                {status === 'error' && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-md text-center">
                    {responseMsg}
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By submitting this form, you agree to be contacted by ProSeason regarding your service request. 
                  We respect your privacy and never share your information.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}