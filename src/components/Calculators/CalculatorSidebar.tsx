"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AboutCalculatorCard from "./AboutCalculatorCard";
import { LucideIcon } from "lucide-react";

interface Tip {
  title: string;
  description: string;
  color: "blue" | "green" | "purple";
}

interface RelatedCalculator {
  href: string;
  icon: LucideIcon;
  title: string;
  status: string;
}

interface CalculatorSidebarProps {
  aboutConfig: {
    icon: LucideIcon;
    description: string;
    features: string[];
    estimatedTime: string;
    difficulty: string;
  };
  tips: Tip[];
  relatedCalculators: RelatedCalculator[];
}

const CalculatorSidebar = ({
  aboutConfig,
  tips,
  relatedCalculators,
}: CalculatorSidebarProps) => {
  const getTipStyles = (color: Tip["color"]) => {
    const styles = {
      blue: {
        bg: "bg-blue-50",
        title: "text-blue-800",
        text: "text-blue-600",
      },
      green: {
        bg: "bg-green-50",
        title: "text-green-800",
        text: "text-green-600",
      },
      purple: {
        bg: "bg-purple-50",
        title: "text-purple-800",
        text: "text-purple-600",
      },
    };
    return styles[color];
  };

  return (
    <div className="sticky top-8 space-y-6">
      {/* About Calculator Card */}
      <AboutCalculatorCard {...aboutConfig} />

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {tips.map((tip, index) => {
              const styles = getTipStyles(tip.color);
              return (
                <div key={index} className={`p-3 ${styles.bg} rounded-lg`}>
                  <p className={`${styles.title} font-medium`}>{tip.title}</p>
                  <p className={`${styles.text} text-xs mt-1`}>{tip.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Related Calculators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Related Calculators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {relatedCalculators.map((calc, index) => {
              const Icon = calc.icon;
              return (
                <Link key={index} href={calc.href} className="block">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{calc.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{calc.status}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorSidebar;

