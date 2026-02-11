import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import Link from "next/link";

export const CallToAction3 = () => {
  return (
    <section className="w-full pb-12 sm:pb-16 px-4">
      <div className="max-w-[1300px] mx-auto">
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full md:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl sm:text-2xl">
                  🏠
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Ready to find your dream home?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Our expert real estate team is here to help you every step of the way.{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Get personalized assistance
                  </Link>
                  {" "}from our experienced agents.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end w-full sm:w-auto">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Phone className="w-4 h-4" />
                Call Us
              </Button>
              <Button className="gap-2 w-full sm:w-auto">
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
