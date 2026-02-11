"use client";

import Link from 'next/link';
import { ArrowLeft, Calculator, Share2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalculatorHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const CalculatorHeader = ({ icon: Icon, title, subtitle }: CalculatorHeaderProps) => {
  return (
    <div className="bg-white border-b">
      <div className="container-1400 mx-auto px-4 py-4 sm:py-6">
        {/* Mobile Layout */}
        <div className="flex flex-col space-y-4 sm:hidden">
          <div className="flex items-center justify-between">
            <Link href="/calculators">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 h-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs py-1 px-2">
                <Calculator className="h-3 w-3 mr-1" />
                Available
              </Badge>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-600">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/calculators">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Calculators</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs py-2 px-4">
              <Calculator className="h-4 w-4 mr-1" />
              Available
            </Badge>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorHeader;
