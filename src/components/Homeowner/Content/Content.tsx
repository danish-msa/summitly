import React from "react";
import { TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingUp,
    label: "Improve your home's value",
  },
  {
    icon: DollarSign,
    label: "Leverage home equity",
  },
  {
    icon: Users,
    label: "See neighbor's home value",
  },
  {
    icon: BarChart3,
    label: "View price and sales trends",
  },
];

const HomeownerContent: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 -mt-24 z-0 relative">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="rounded-xl bg-white p-6 shadow-sm shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col items-center text-center gap-4"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9]"
              aria-hidden
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">
              {label}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomeownerContent;
