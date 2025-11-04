"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2, TrendingUp, Search } from "lucide-react";
import SectionHeading from "@/components/Helper/SectionHeading";
import { useLocationDetection } from "@/hooks/useLocationDetection";

interface Recommendation {
  title: string;
  subtitle: string;
  link: string;
}

interface RecommendationCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  recommendations: Recommendation[];
}

// Base recommendation data templates
const baseRecommendationsData: RecommendationCategory[] = [
  {
    id: "real-estate",
    label: "Real Estate",
    icon: <Home className="w-4 h-4" />,
    recommendations: [
      { title: "Browse all homes", subtitle: "{location} real estate", link: "/listings" },
      { title: "Luxury properties", subtitle: "{location} luxury homes", link: "/listings?propertyType=luxury" },
      { title: "New listings", subtitle: "Latest {location} listings", link: "/listings?sort=newest" },
      { title: "Price reduced", subtitle: "Reduced price homes", link: "/listings?sort=price-reduced" },
      { title: "Open houses", subtitle: "{location} open houses", link: "/listings?type=open-house" },
      { title: "Foreclosures", subtitle: "{location} foreclosure deals", link: "/listings?type=foreclosure" },
      { title: "Waterfront properties", subtitle: "{location} waterfront homes", link: "/listings?feature=waterfront" },
      { title: "Historic homes", subtitle: "{location} heritage properties", link: "/listings?feature=historic" },
      { title: "New construction", subtitle: "{location} new builds", link: "/listings?type=new-construction" },
      { title: "Investment properties", subtitle: "{location} rental investments", link: "/listings?type=investment" },
      { title: "Condo developments", subtitle: "{location} new condos", link: "/listings?propertyType=condo&type=new" },
      { title: "Townhouses", subtitle: "{location} townhouse listings", link: "/listings?propertyType=townhouse" },
    ],
  },
  {
    id: "rentals",
    label: "Rentals",
    icon: <Building2 className="w-4 h-4" />,
    recommendations: [
      { title: "Rental Buildings", subtitle: "{location} apartments for rent", link: "/listings?type=rental" },
      { title: "Condos for rent", subtitle: "{location} condos for rent", link: "/listings?type=rental&propertyType=condo" },
      { title: "Houses for rent", subtitle: "{location} houses for rent", link: "/listings?type=rental&propertyType=house" },
      { title: "Studio apartments", subtitle: "{location} studios for rent", link: "/listings?type=rental&bedrooms=0" },
      { title: "Luxury rentals", subtitle: "{location} luxury rentals", link: "/listings?type=rental&propertyType=luxury" },
      { title: "Pet friendly", subtitle: "{location} pet friendly rentals", link: "/listings?type=rental&petFriendly=true" },
      { title: "Furnished rentals", subtitle: "{location} furnished apartments", link: "/listings?type=rental&furnished=true" },
      { title: "Short term rentals", subtitle: "{location} short term leases", link: "/listings?type=rental&lease=short-term" },
      { title: "Student housing", subtitle: "{location} student accommodations", link: "/listings?type=rental&target=students" },
      { title: "Corporate housing", subtitle: "{location} corporate rentals", link: "/listings?type=rental&target=corporate" },
      { title: "Basement apartments", subtitle: "{location} basement rentals", link: "/listings?type=rental&propertyType=basement" },
      { title: "Room rentals", subtitle: "{location} room shares", link: "/listings?type=rental&propertyType=room" },
    ],
  },
  {
    id: "mortgage",
    label: "Mortgage Rates",
    icon: <TrendingUp className="w-4 h-4" />,
    recommendations: [
      { title: "Current mortgage rates", subtitle: "{location} mortgage rates", link: "/mortgage-rates" },
      { title: "30-year fixed rates", subtitle: "{location} mortgage rates", link: "/mortgage-rates?type=30-year" },
      { title: "15-year fixed rates", subtitle: "{location} mortgage rates", link: "/mortgage-rates?type=15-year" },
      { title: "FHA loan rates", subtitle: "{location} FHA rates", link: "/mortgage-rates?type=fha" },
      { title: "First-time buyer", subtitle: "{location} first-time buyer programs", link: "/first-time-buyer" },
      { title: "Refinancing", subtitle: "{location} refinancing options", link: "/refinancing" },
      { title: "Variable rates", subtitle: "{location} variable mortgages", link: "/mortgage-rates?type=variable" },
      { title: "Jumbo loans", subtitle: "{location} jumbo mortgages", link: "/mortgage-rates?type=jumbo" },
      { title: "Construction loans", subtitle: "{location} construction financing", link: "/mortgage-rates?type=construction" },
      { title: "Investment loans", subtitle: "{location} investment mortgages", link: "/mortgage-rates?type=investment" },
      { title: "HELOC rates", subtitle: "{location} home equity lines", link: "/mortgage-rates?type=heloc" },
      { title: "Reverse mortgages", subtitle: "{location} reverse mortgage options", link: "/mortgage-rates?type=reverse" },
    ],
  },
  {
    id: "browse",
    label: "Browse Homes",
    icon: <Search className="w-4 h-4" />,
    recommendations: [
      { title: "Toronto", subtitle: "Browse homes in Toronto", link: "/listings?location=toronto" },
      { title: "Mississauga", subtitle: "Browse homes in Mississauga", link: "/listings?location=mississauga" },
      { title: "Brampton", subtitle: "Browse homes in Brampton", link: "/listings?location=brampton" },
      { title: "Markham", subtitle: "Browse homes in Markham", link: "/listings?location=markham" },
      { title: "Vaughan", subtitle: "Browse homes in Vaughan", link: "/listings?location=vaughan" },
      { title: "Richmond Hill", subtitle: "Browse homes in Richmond Hill", link: "/listings?location=richmond-hill" },
      { title: "Oakville", subtitle: "Browse homes in Oakville", link: "/listings?location=oakville" },
      { title: "Burlington", subtitle: "Browse homes in Burlington", link: "/listings?location=burlington" },
      { title: "Ajax", subtitle: "Browse homes in Ajax", link: "/listings?location=ajax" },
      { title: "Pickering", subtitle: "Browse homes in Pickering", link: "/listings?location=pickering" },
      { title: "Whitby", subtitle: "Browse homes in Whitby", link: "/listings?location=whitby" },
      { title: "Oshawa", subtitle: "Browse homes in Oshawa", link: "/listings?location=oshawa" },
    ],
  },
];

// Default location values
const defaultLocation = { city: "Toronto", area: "GTA", displayName: "Toronto" };

export const RecommendationsSection = () => {
  const [activeTab, setActiveTab] = useState("real-estate");
  const { location } = useLocationDetection();

  // Generate location display name
  const locationDisplayName = useMemo(() => {
    if (location) {
      // Format: "Area, City" or just "City" if no area
      if (location.area && location.area !== location.city) {
        return `${location.area}, ${location.city}`;
      }
      return location.city || defaultLocation.displayName;
    }
    return defaultLocation.displayName;
  }, [location]);

  // Generate dynamic recommendations based on location
  const recommendationsData = useMemo(() => {
    return baseRecommendationsData.map((category) => ({
      ...category,
      recommendations: category.recommendations.map((rec) => {
        // For browse tab, keep original subtitles as they are city-specific
        if (category.id === "browse") {
          return rec;
        }
        // For other tabs, replace {location} placeholder with actual location
        return {
          ...rec,
          subtitle: rec.subtitle.replace(/{location}/g, locationDisplayName),
        };
      }),
    }));
  }, [locationDisplayName]);

  return (
    <section className="w-full py-16 px-4 bg-white">
      <div className="container-1400 mx-auto">
        <SectionHeading
          heading="Explore Our Recommendations"
          subheading="Explore Our Recommendations"
          description="Discover personalized suggestions across real estate, rentals, mortgage rates, and more"
        />


        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-brand-glacier/30 p-2 rounded-xl">
            {recommendationsData.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-brand-mist data-[state=active]:text-primary flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
              >
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden text-xs">{category.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {recommendationsData.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="mt-8 animate-fade-in"
            >
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {category.recommendations.map((rec, index) => (
                   <Card
                     key={index}
                     className="group flex items-center  p-3 hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-transparent hover:bg-gradient-to-r hover:from-brand-glacier hover:to-brand-ice-blue"
                   >
                    <a href={rec.link} className="block">
                      <h3 className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        {rec.title}
                      </h3>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {rec.subtitle}
                      </p>
                    </a>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
