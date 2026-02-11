import React, { useState } from 'react'
import { DollarSign, Bed, Calculator, Car, Package, Plus, Tag } from "lucide-react"
import { PropertyListing } from '@/lib/types'
import RequestFurtherInfoModal from './RequestFurtherInfoModal'

interface Incentive {
  title: string;
  value?: string;
  highlight?: boolean;
}

interface PricingIncentivesProps {
  property: PropertyListing;
  isAssignment?: boolean;
}

interface ExtendedPreCon {
  avgPricePerSqft?: number | null;
  parkingPrice?: number | null;
  lockerPrice?: number | null;
  assignmentFee?: number | null;
  originalPurchasePrice?: number | null;
  depositPaid?: number | null;
  totalPayment?: number | null;
  developmentCharges?: number | null;
  developmentLevies?: number | null;
  maintenanceFeesPerSqft?: number | null;
  parkingPriceDetail?: string | null;
  lockerPriceDetail?: string | null;
  maintenanceFeesDetail?: string | null;
  floorPremiums?: string | null;
  promotions?: string | null;
}

const PricingIncentives: React.FC<PricingIncentivesProps> = ({ property, isAssignment = false }) => {
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

  const parsePromotions = (promotionsString: string | null | undefined): Incentive[] => {
    if (!promotionsString) return []

    const items = promotionsString.split(/[,\n]/).map(item => item.trim()).filter(Boolean)
    return items.map(item => ({
      title: item,
      highlight: item.toLowerCase().includes('free') || item.toLowerCase().includes('included')
    }))
  }

  const incentives: Incentive[] = parsePromotions(extendedPreCon.promotions)

  // Get 1 Bed and 2 Bed prices
  const oneBedPrice = preCon.priceRange ? formatPrice(preCon.priceRange.min) : (preCon.startingPrice && preCon.startingPrice > 0 ? formatPrice(preCon.startingPrice) : null)
  const twoBedPrice = getBedroomPricing() || (preCon.priceRange ? formatPrice(preCon.priceRange.max) : null)

  return (
    <div className="w-full pl-14">
      <h2 className="text-2xl font-bold text-foreground mb-6">Pricing & Incentives</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Assignment details (assignments) or Price Range (pre-con) */}
        <div className="bg-muted/20 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-secondary" />
            </div>
            <span className="font-bold text-foreground">
              {isAssignment ? 'Assignment details' : 'Price Range'}
            </span>
          </div>
          
          <div className="space-y-4">
            {isAssignment ? (
              <>
                {(property.listPrice != null && property.listPrice > 0) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current Price</span>
                    <span className="font-bold text-foreground">{formatPrice(property.listPrice)}</span>
                  </div>
                )}
                {extendedPreCon.originalPurchasePrice != null && extendedPreCon.originalPurchasePrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Original Purchase Price</span>
                    <span className="font-bold text-foreground">{formatPrice(extendedPreCon.originalPurchasePrice)}</span>
                  </div>
                )}
                {pricePerSqft != null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-gray-500" aria-hidden />
                      <span className="text-sm text-gray-500">Price Per SqFt</span>
                    </div>
                    <span className="font-bold text-foreground">${pricePerSqft.toLocaleString()}</span>
                  </div>
                )}
                {extendedPreCon.depositPaid != null && extendedPreCon.depositPaid > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Deposit Paid</span>
                    <span className="font-bold text-foreground">{formatPrice(extendedPreCon.depositPaid)}</span>
                  </div>
                )}
                {extendedPreCon.totalPayment != null && extendedPreCon.totalPayment > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Payment</span>
                    <span className="font-bold text-foreground">{formatPrice(extendedPreCon.totalPayment)}</span>
                  </div>
                )}
                {extendedPreCon.assignmentFee != null && extendedPreCon.assignmentFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Assignment Fee</span>
                    <span className="font-bold text-foreground">{formatPrice(extendedPreCon.assignmentFee)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {oneBedPrice && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-gray-500" aria-hidden />
                      <span className="text-sm text-gray-500">1 Bed From</span>
                    </div>
                    <span className="font-bold text-foreground">{oneBedPrice}</span>
                  </div>
                )}
                {twoBedPrice && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-gray-500" aria-hidden />
                      <span className="text-sm text-gray-500">2 Bed From</span>
                    </div>
                    <span className="font-bold text-foreground">{twoBedPrice}</span>
                  </div>
                )}
                {oneBedPrice && twoBedPrice && <div className="border-t border-gray-200 my-4" />}
                {pricePerSqft && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-gray-500" aria-hidden />
                      <span className="text-sm text-gray-500">Per Sqft</span>
                    </div>
                    <span className="font-bold text-foreground">${pricePerSqft.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card 2: Additional Costs */}
        <div className="bg-muted/20 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-secondary" />
            </div>
            <span className="font-bold text-foreground">Additional Costs</span>
          </div>
          
          <div className="space-y-4">
            {extendedPreCon.parkingPrice && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Parking</span>
                </div>
                <span className="font-bold text-foreground">{formatPrice(extendedPreCon.parkingPrice)}</span>
              </div>
            )}
            
            {extendedPreCon.lockerPrice && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Locker</span>
                </div>
                <span className="font-bold text-foreground">{formatPrice(extendedPreCon.lockerPrice)}</span>
              </div>
            )}
            
            {extendedPreCon.maintenanceFeesPerSqft && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Maint./sqft</span>
                </div>
                <span className="font-bold text-foreground">${extendedPreCon.maintenanceFeesPerSqft.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Limited Time Incentives */}
        <div className="bg-muted/20 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center">
              <Tag className="h-5 w-5 text-secondary" />
            </div>
            <span className="font-bold text-foreground">Limited Time Incentives</span>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[120px]">
            {incentives.length > 0 ? (
              <div className="space-y-2 w-full">
                {incentives.slice(0, 3).map((incentive, index) => (
                  <div key={index} className="text-sm text-muted-foreground text-center">
                    {incentive.title}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center mb-4">No incentives available</p>
            )}
            
            <button className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg py-2 px-4 text-sm font-medium transition-colors">
              Competitive Pre-Construction Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Request Further Info Modal */}
      <RequestFurtherInfoModal
        open={isRequestInfoModalOpen}
        onOpenChange={setIsRequestInfoModalOpen}
        projectName={preCon.projectName}
      />
    </div>
  );
};

export default PricingIncentives;
