"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/Helper/SectionHeading";

interface Recommendation {
  title: string;
  link: string;
}

const cities = [
  "Ajax",
  "Aurora",
  "Barrie",
  "Bowmanville",
  "Brampton",
  "Burlington",
  "Caledon",
  "Etobicoke",
  "Hamilton",
  "Markham",
  "Milton",
  "Mississauga",
  "Newmarket",
  "North York",
  "Oakville",
  "Oshawa",
  "Pickering",
  "Richmond Hill",
  "Scarborough",
  "Thornhill",
  "Toronto",
  "Vaughan",
];

const generateRecommendations = (type: "Homes" | "Condos"): Recommendation[] => {
  return cities.map((city) => ({
    title: `New ${type} ${city}`,
    link: `/pre-con/${city.toLowerCase().replace(/\s+/g, "-")}`,
  }));
};

export const NewHomesRecommendations = () => {
  const [activeTab, setActiveTab] = useState("homes");

  const homesRecommendations = generateRecommendations("Homes");
  const condosRecommendations = generateRecommendations("Condos");

  return (
    <section className="w-full py-16 bg-white">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="New Homes and Condos in Canada"
          subheading="New Homes and Condos in Canada"
          description="Discover new construction homes and condos across Canada"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 flex flex-col items-center justify-center">
          <TabsList className="grid grid-cols-2 h-auto gap-2 bg-brand-glacier/30 p-2 rounded-xl">
            <TabsTrigger
              value="homes"
              className="data-[state=active]:bg-secondary data-[state=active]:text-white text-base flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
            >
              <Home className="w-4 h-4" />
              <span>New Homes</span>
            </TabsTrigger>
            <TabsTrigger
              value="condos"
              className="data-[state=active]:bg-secondary data-[state=active]:text-white text-base flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
            >
              <Building2 className="w-4 h-4" />
              <span>New Condos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="homes" className="mt-8 animate-fade-in w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {homesRecommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="group flex items-center gap-3 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-transparent hover:bg-gradient-to-r hover:from-brand-glacier hover:to-brand-ice-blue overflow-hidden"
                >
                  <a href={rec.link} className="block w-full flex items-center justify-between gap-3">
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                      {rec.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="condos" className="mt-8 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {condosRecommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="group flex items-center gap-3 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-transparent hover:bg-gradient-to-r hover:from-brand-glacier hover:to-brand-ice-blue overflow-hidden"
                >
                  <a href={rec.link} className="block w-full flex items-center justify-between gap-3">
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                      {rec.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

