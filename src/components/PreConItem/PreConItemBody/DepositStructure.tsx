import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText } from 'lucide-react'

interface DepositStructureProps {
  property: PropertyListing;
}

const DepositStructure: React.FC<DepositStructureProps> = ({ property }) => {
  const preCon = property.preCon;
  
  if (!preCon || !preCon.depositStructure) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Deposit structure information not available
      </div>
    );
  }

  // Parse deposit structure (this is a simple parser, you may want to enhance it)
  const depositInfo = preCon.depositStructure;

  // Extract completion date for incentives expiry (similar to PricingIncentives)
  const getIncentivesExpiryDate = () => {
    if (!preCon.completion?.date) return null;
    const yearMatch = preCon.completion.date.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      return `Apr 1, ${year}`;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Deposit Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50">
              <div className="w-10 h-10 rounded-lg bg-brand-celestial/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Payment Schedule</p>
                <p className="font-semibold text-foreground">{depositInfo}</p>
              </div>
            </div>
            {getIncentivesExpiryDate() && (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50">
                <div className="w-10 h-10 rounded-lg bg-brand-celestial/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Incentives Valid Until</p>
                  <p className="font-semibold text-foreground">{getIncentivesExpiryDate()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-red-50">
        <CardHeader className="bg-red-100 rounded-t-lg mb-2">
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Deposit structure may vary by unit type and floor plan</p>
            <p>• All deposits are held in trust until closing</p>
            <p>• Please consult with your real estate agent for specific deposit requirements</p>
            <p>• Terms and conditions apply as per the purchase agreement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositStructure;

