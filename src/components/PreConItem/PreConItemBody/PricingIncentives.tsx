import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, DollarSign, TrendingUp, Star, Bed, Maximize2, Calculator } from "lucide-react"
import { PropertyListing } from '@/lib/types'

interface PriceItem {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Incentive {
  title: string;
  value?: string;
  highlight?: boolean;
}

interface PricingIncentivesProps {
  property: PropertyListing;
}

const PricingIncentives: React.FC<PricingIncentivesProps> = ({ property }) => {
  const preCon = property.preCon;
  
  if (!preCon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Pricing and incentives not available
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate price per sqft if we have price range and sqft range
  const calculatePricePerSqft = () => {
    if (!preCon.priceRange || !preCon.details?.sqftRange) return null;
    
    const sqftRange = preCon.details.sqftRange;
    const maxSqftMatch = sqftRange.match(/(\d{1,3}(?:,\d{3})*)/g);
    if (maxSqftMatch && maxSqftMatch.length > 0) {
      const maxSqft = parseInt(maxSqftMatch[maxSqftMatch.length - 1].replace(/,/g, ''));
      if (maxSqft && preCon.priceRange.max) {
        return Math.round(preCon.priceRange.max / maxSqft);
      }
    }
    return null;
  };

  const pricePerSqft = calculatePricePerSqft();

  // Extract bedroom info for pricing
  const getBedroomPricing = () => {
    if (!preCon.details?.bedroomRange) return null;
    const range = preCon.details.bedroomRange;
    if (range.includes('1')) {
      return preCon.priceRange ? formatPrice(preCon.priceRange.min) : 'N/A';
    }
    if (range.includes('2')) {
      return preCon.priceRange ? formatPrice(Math.round((preCon.priceRange.min + preCon.priceRange.max) / 2)) : 'N/A';
    }
    return 'N/A';
  };

  const priceData: PriceItem[] = [
    { label: "1 Bed Starting From", value: preCon.priceRange ? formatPrice(preCon.priceRange.min) : "N/A", icon: Bed },
    { label: "2 Bed Starting From", value: getBedroomPricing() || "N/A", icon: Bed },
    { label: "Price Per Sqft", value: pricePerSqft ? `$${pricePerSqft.toLocaleString()}` : "N/A", icon: Calculator },
    { label: "Avg Price Per Sqft", value: pricePerSqft ? `$${pricePerSqft.toLocaleString()} / sqft` : "N/A", icon: TrendingUp },
    { label: "Pre-Con Avg Price Per Sq Ft", value: pricePerSqft ? `$${Math.round(pricePerSqft * 0.75).toLocaleString()} / sqft` : "N/A", icon: Maximize2 },
  ];

  // Mock incentives - in a real app, this would come from the property data
  const incentives: Incentive[] = [
    { title: "Free Assignment", highlight: true },
    { title: "Free Right to Lease During Occupancy", highlight: true },
    { title: "Capped Development Charges" },
    { title: "$15,000 + HST (1 Bedroom + Den and Smaller)", value: "Small Units" },
    { title: "$18,000 + HST (2 Bedroom and Larger)", value: "Large Units" },
    { title: "Free Kitchen Island", value: "Valued at $15,000 to $25,000" },
    { title: "Free Sliding Door to Den", value: "Valued at $5,000" },
  ];

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-2 gap-8 mb-0 items-start">
        {/* Pricing Card */}
        <Card className="shadow-lg border-border bg-green-50 hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-border bg-green-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-primary" />
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {priceData.map((item, index) => {
                const IconComponent = item.icon || DollarSign;
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground font-medium text-sm">{item.label}</span>
                    </div>
                    <span className="text-foreground font-bold text-base">{item.value}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-2 bg-green-300 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-primary justify-center font-semibold">
                <TrendingUp className="h-5 w-5" />
                <span>Competitive Pre-Construction Pricing</span>
              </div>
            </div>
          </CardContent>
          {/* CTA Section */}
          <div className="text-center mt-4 p-4 bg-white rounded-b-lg">
            <p className="text-muted-foreground mb-4">
              Need more information about pricing?
            </p>
            <button className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg">
              Get a Free Consultation
            </button>
          </div>
        </Card>
        

        {/* Limited Time Incentives Card */}
        <Card className="shadow-lg border-border bg-purple-50 hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-border bg-purple-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-primary" />
              Limited Time Incentives
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-6 mb-3">
              {incentives.map((incentive, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {incentive.title}
                    </div>
                    {incentive.value && (
                      <div className="text-muted-foreground text-xs mt-0.5">{incentive.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingIncentives;

