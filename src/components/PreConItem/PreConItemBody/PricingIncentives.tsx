import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, DollarSign, TrendingUp, Star, Bed, Calculator, Car, Package, FileText, Wrench, Home } from "lucide-react"
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

// Extended preCon type with additional database fields
interface ExtendedPreCon {
  avgPricePerSqft?: number | null;
  parkingPrice?: number | null;
  lockerPrice?: number | null;
  assignmentFee?: number | null;
  developmentCharges?: number | null;
  developmentLevies?: number | null;
  maintenanceFeesPerSqft?: number | null;
  parkingPriceDetail?: string | null;
  lockerPriceDetail?: string | null;
  maintenanceFeesDetail?: string | null;
  floorPremiums?: string | null;
  promotions?: string | null;
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

  // Use avgPricePerSqft from database if available, otherwise calculate
  const extendedPreCon = preCon as ExtendedPreCon;
  const pricePerSqft = extendedPreCon.avgPricePerSqft || calculatePricePerSqft();

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
  ];

  // Additional pricing fields
  const additionalPricing: PriceItem[] = []
  if (extendedPreCon.parkingPrice) {
    additionalPricing.push({
      label: "Parking Price",
      value: formatPrice(extendedPreCon.parkingPrice),
      icon: Car
    })
  }
  if (extendedPreCon.lockerPrice) {
    additionalPricing.push({
      label: "Locker Price",
      value: formatPrice(extendedPreCon.lockerPrice),
      icon: Package
    })
  }
  if (extendedPreCon.assignmentFee) {
    additionalPricing.push({
      label: "Assignment Fee",
      value: formatPrice(extendedPreCon.assignmentFee),
      icon: FileText
    })
  }
  if (extendedPreCon.developmentCharges) {
    additionalPricing.push({
      label: "Development Charges",
      value: formatPrice(extendedPreCon.developmentCharges),
      icon: Wrench
    })
  }
  if (extendedPreCon.developmentLevies) {
    additionalPricing.push({
      label: "Development Levies",
      value: formatPrice(extendedPreCon.developmentLevies),
      icon: Wrench
    })
  }
  if (extendedPreCon.maintenanceFeesPerSqft) {
    additionalPricing.push({
      label: "Maintenance Fees Per Sqft",
      value: `$${(extendedPreCon.maintenanceFeesPerSqft).toLocaleString()} / sqft`,
      icon: Home
    })
  }

  // Parse promotions from string (comma-separated or newline-separated)
  const parsePromotions = (promotionsString: string | null | undefined): Incentive[] => {
    if (!promotionsString) return []
    
    // Split by comma or newline
    const items = promotionsString.split(/[,\n]/).map(item => item.trim()).filter(Boolean)
    
    return items.map(item => ({
      title: item,
      highlight: item.toLowerCase().includes('free') || item.toLowerCase().includes('included')
    }))
  }

  const incentives: Incentive[] = parsePromotions(extendedPreCon.promotions)

  return (
    <div className="w-full space-y-6">
      <div className="grid md:grid-cols-2 gap-8 items-start">
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
            {additionalPricing.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Additional Costs</h4>
                <div className="space-y-2">
                  {additionalPricing.map((item, index) => {
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
                {/* Show details if available */}
                {(extendedPreCon.parkingPriceDetail || extendedPreCon.lockerPriceDetail || extendedPreCon.maintenanceFeesDetail || extendedPreCon.floorPremiums) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {extendedPreCon.parkingPriceDetail && (
                        <p><strong>Parking:</strong> {extendedPreCon.parkingPriceDetail}</p>
                      )}
                      {extendedPreCon.lockerPriceDetail && (
                        <p><strong>Locker:</strong> {extendedPreCon.lockerPriceDetail}</p>
                      )}
                      {extendedPreCon.maintenanceFeesDetail && (
                        <p><strong>Maintenance:</strong> {extendedPreCon.maintenanceFeesDetail}</p>
                      )}
                      {extendedPreCon.floorPremiums && (
                        <p><strong>Floor Premiums:</strong> {extendedPreCon.floorPremiums}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {incentives.length > 0 ? (
              <div className="flex flex-col gap-6 mb-3">
                {incentives.map((incentive, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${incentive.highlight ? 'p-3 bg-purple-100 rounded-lg' : ''}`}
                  >
                    <CheckCircle2
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${incentive.highlight ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <div className={`font-medium text-sm ${incentive.highlight ? 'text-primary font-semibold' : ''}`}>
                        {incentive.title}
                      </div>
                      {incentive.value && (
                        <div className="text-muted-foreground text-xs mt-0.5">{incentive.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No incentives available at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingIncentives;

