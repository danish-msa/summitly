import React, { useState } from 'react'
import { CheckCircle2, DollarSign, TrendingUp, Star, Bed, Calculator, Car, Package, FileText, Home, ChevronRight } from "lucide-react"
import { PropertyListing } from '@/lib/types'
import RequestFurtherInfoModal from './RequestFurtherInfoModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceItem {
  label: string;
  value: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  show?: boolean;
}

interface Incentive {
  title: string;
  value?: string;
  highlight?: boolean;
}

interface PricingIncentivesProps {
  property: PropertyListing;
}

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
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);

  if (!preCon) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Pricing information not available
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

  const calculatePricePerSqft = () => {
    if (!preCon.priceRange || !preCon.details?.sqftRange) return null;

    const sqftRange = preCon.details.sqftRange;
    if (!sqftRange) return null;

    const maxSqftMatch = sqftRange.match(/(\d{1,3}(?:,\d{3})*)/g);
    if (maxSqftMatch && maxSqftMatch.length > 0) {
      const maxSqft = parseInt(maxSqftMatch[maxSqftMatch.length - 1].replace(/,/g, ''));
      if (maxSqft && preCon.priceRange.max) {
        return Math.round(preCon.priceRange.max / maxSqft);
      }
    }

    return null;
  };

  const extendedPreCon = preCon as ExtendedPreCon;
  const pricePerSqft = extendedPreCon.avgPricePerSqft || calculatePricePerSqft();

  const getBedroomPricing = () => {
    if (!preCon.details?.bedroomRange) return null;

    const range = preCon.details.bedroomRange;
    if (!range) return null;

    if (range.includes('1')) {
      return preCon.priceRange ? formatPrice(preCon.priceRange.min) : null;
    }

    if (range.includes('2')) {
      return preCon.priceRange ? formatPrice(Math.round((preCon.priceRange.min + preCon.priceRange.max) / 2)) : null;
    }

    return null;
  };

  const priceData: PriceItem[] = [
    { 
      label: "1 Bed From", 
      value: preCon.priceRange ? formatPrice(preCon.priceRange.min) : (preCon.startingPrice && preCon.startingPrice > 0 ? formatPrice(preCon.startingPrice) : null), 
      icon: Bed,
      show: !!(preCon.priceRange || (preCon.startingPrice && preCon.startingPrice > 0))
    },
    { 
      label: "2 Bed From", 
      value: getBedroomPricing() || (preCon.priceRange ? formatPrice(preCon.priceRange.max) : null), 
      icon: Bed,
      show: !!(getBedroomPricing() || preCon.priceRange)
    },
    { 
      label: "Per Sqft", 
      value: pricePerSqft ? `$${pricePerSqft.toLocaleString()}` : null, 
      icon: Calculator,
      show: !!pricePerSqft
    },
  ].filter(item => item.show && item.value);

  const additionalPricing: PriceItem[] = []
  if (extendedPreCon.parkingPrice) {
    additionalPricing.push({ label: "Parking", value: formatPrice(extendedPreCon.parkingPrice), icon: Car })
  }
  if (extendedPreCon.lockerPrice) {
    additionalPricing.push({ label: "Locker", value: formatPrice(extendedPreCon.lockerPrice), icon: Package })
  }
  if (extendedPreCon.assignmentFee) {
    additionalPricing.push({ label: "Assignment", value: formatPrice(extendedPreCon.assignmentFee), icon: FileText })
  }
  if (extendedPreCon.maintenanceFeesPerSqft) {
    additionalPricing.push({ label: "Maint./sqft", value: `$${extendedPreCon.maintenanceFeesPerSqft.toLocaleString()}`, icon: Home })
  }

  const parsePromotions = (promotionsString: string | null | undefined): Incentive[] => {
    if (!promotionsString) return []

    const items = promotionsString.split(/[,\n]/).map(item => item.trim()).filter(Boolean)
    return items.map(item => ({
      title: item,
      highlight: item.toLowerCase().includes('free') || item.toLowerCase().includes('included')
    }))
  }

  const incentives: Incentive[] = parsePromotions(extendedPreCon.promotions)

  return (
    <Card variant="transparent">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pricing Section */}
        <div className="rounded-lg space-y-3">
          <div className="flex items-center gap-2 pb-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm text-foreground">Price Range</span>
          </div>

          {/* Main prices - horizontal compact grid */}
          <div className="grid grid-cols-3 gap-2">
            {priceData.map((item, index) => {
              const IconComponent = item.icon || DollarSign;
              return (
                <div key={index} className="rounded-md p-2.5 text-center bg-secondary/10">
                  <IconComponent className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                  <div className="font-bold text-sm text-foreground">{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* Additional costs - inline */}
          {additionalPricing.length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2">Additional Costs</div>
              <div className="flex flex-wrap gap-2">
                {additionalPricing.map((item, index) => {
                  const IconComponent = item.icon || DollarSign;
                  return (
                    <div key={index} className="flex items-center gap-1.5 bg-card rounded-md px-2 py-1 border border-border/50 text-xs">
                      <IconComponent className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <button 
            onClick={() => setIsRequestInfoModalOpen(true)}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span>Get Consultation</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Incentives Section */}
        <Card variant="light">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                Limited Time Incentives
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {incentives.length > 0 ? (
              <div className="space-y-2">
                {incentives.slice(0, 4).map((incentive, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                      incentive.highlight 
                        ? 'bg-accent/10 border border-accent/20' 
                        : 'bg-card border border-border/50'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      incentive.highlight ? 'text-accent' : 'text-muted-foreground'
                    }`} />
                    <span className={`text-sm ${incentive.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {incentive.title}
                    </span>
                  </div>
                ))}

                {incentives.length > 4 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{incentives.length - 4} more incentives
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Star className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No incentives available</p>
              </div>
            )}

            {/* Competitive badge */}
            <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-md py-2 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Competitive Pre-Construction Pricing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Further Info Modal */}
      <RequestFurtherInfoModal
        open={isRequestInfoModalOpen}
        onOpenChange={setIsRequestInfoModalOpen}
        projectName={preCon.projectName}
      />
    </Card>
  );
};

export default PricingIncentives;
