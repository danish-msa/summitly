import { Button } from "@/components/ui/button";
import { MessageCircle, Headphones, MapPin, Phone } from "lucide-react";

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Chat with an agent",
    description: "Get instant help from our real estate experts.",
    buttonText: "Start chat",
    href: "/contact",
  },
  {
    icon: Headphones,
    title: "Get support",
    description: "Technical assistance and account help.",
    buttonText: "Get support",
    href: "/contact",
  },
  {
    icon: MapPin,
    title: "Visit our office",
    description: "Meet us at our downtown location.",
    buttonText: "Get directions",
    href: "/contact",
  },
  {
    icon: Phone,
    title: "Call us directly",
    description: "Mon-Fri 9am-6pm, Sat 10am-4pm.",
    buttonText: "Call now",
    href: "tel:+1-555-REALTY",
  },
];

export const ContactMethods = () => {
  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Get in touch with us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred way to connect with our real estate team. We're here to help you find your perfect home.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.title}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow hover:border-primary/20 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:border-primary/50" asChild>
                  <a href={option.href}>{option.buttonText}</a>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactMethods;
