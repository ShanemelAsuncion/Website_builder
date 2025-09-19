import { Card, CardContent } from "./ui/card";
import { Users, Award, Clock, Shield } from "lucide-react";

const stats = [
  { icon: Users, label: "Happy Customers", value: "500+" },
  { icon: Award, label: "Years Experience", value: "15+" },
  { icon: Clock, label: "Response Time", value: "< 2hrs" },
  { icon: Shield, label: "Insured & Bonded", value: "100%" }
];

export function About() {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl mb-6">About BladeSnow Pro</h2>
            <p className="text-lg text-muted-foreground mb-6">
              For over 15 years, BladeSnow Pro has been the trusted choice for residential and commercial property maintenance. Our team of experienced professionals is committed to delivering exceptional results, whether it's maintaining your lawn during the growing season or keeping your property safe and accessible during winter.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              We pride ourselves on reliability, attention to detail, and customer satisfaction. Our comprehensive approach ensures your property looks its best year-round, giving you peace of mind and more time to focus on what matters most.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl mb-3">Our Mission</h3>
                <p className="text-muted-foreground">
                  To provide reliable, professional outdoor maintenance services that enhance property value and give our clients peace of mind throughout every season.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl mb-3">Why Choose Us?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mr-3"></div>
                    Licensed and insured professionals
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mr-3"></div>
                    Modern, well-maintained equipment
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mr-3"></div>
                    Flexible scheduling and competitive pricing
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mr-3"></div>
                    100% satisfaction guarantee
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}