import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";

export const CallToAction3 = () => {
  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  🏠
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to find your dream home?
                </h3>
                <p className="text-muted-foreground">
                  Our expert real estate team is here to help you every step of the way.{" "}
                  <a href="/contact" className="text-primary hover:underline">
                    Get personalized assistance
                  </a>
                  {" "}from our experienced agents.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              <Button variant="outline" className="gap-2">
                <Phone className="w-4 h-4" />
                Call Us
              </Button>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Get in touch
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction3;
