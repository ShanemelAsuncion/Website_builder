import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface ContactProps {
  season: 'summer' | 'winter';
}

export function Contact({ season }: ContactProps) {
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
                    <div className="font-medium">(555) 123-4567</div>
                    <div className="text-sm text-muted-foreground">Available 24/7 for emergencies</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">info@proseason.com</div>
                    <div className="text-sm text-muted-foreground">Response within 2 hours</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Greater Metro Area</div>
                    <div className="text-sm text-muted-foreground">50+ mile service radius</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Mon-Fri: 7AM-6PM</div>
                    <div className="text-sm text-muted-foreground">Weekend emergency service</div>
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

              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="h-12" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" className="h-12" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service Needed</Label>
                  <Select>
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
                  <Label htmlFor="address">Property Address</Label>
                  <Input id="address" placeholder="123 Main St, City, State 12345" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your property size, specific needs, timeline, or any questions you have..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button className="w-full h-12 text-base group">
                  <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Send Quote Request
                </Button>
                
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