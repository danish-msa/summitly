"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, LucideIcon } from "lucide-react";

interface AboutCalculatorCardProps {
  icon: LucideIcon;
  description: string;
  features: string[];
  estimatedTime: string;
  difficulty: string;
}

const AboutCalculatorCard = ({
  icon: Icon,
  description,
  features,
  estimatedTime,
  difficulty,
}: AboutCalculatorCardProps) => {
  return (
    <Card className="bg-gradient-to-b from-brand-celestial to-brand-cb-blue text-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Icon className="h-5 w-5 mr-2 text-white" />
          About This Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-white font-light">
          {description}
        </CardDescription>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">What you'll calculate:</h4>
            <ul className="text-xs text-white space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center text-white">
                  <span className="w-1 h-1 bg-white rounded-full mr-2"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex items-center text-xs text-white mb-2">
              <Clock className="h-3 w-3 mr-1" />
              Estimated time: {estimatedTime}
            </div>
            <div className="flex items-center text-xs text-white">
              <BookOpen className="h-3 w-3 mr-1" />
              Difficulty: {difficulty}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutCalculatorCard;

