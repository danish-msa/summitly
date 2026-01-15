import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Wallet } from "lucide-react";

interface AffordabilityData {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  interestRate: number;
  mortgageTerm: number;
  propertyPrice: number;
}

interface AffordabilityCalculatorProps {
  propertyPrice?: number;
}

const AffordabilityCalculator = ({ propertyPrice = 1999000 }: AffordabilityCalculatorProps) => {
  const [data, setData] = useState<AffordabilityData>({
    annualIncome: 100000,
    monthlyDebts: 0,
    downPayment: 50000,
    interestRate: 4.84,
    mortgageTerm: 25,
    propertyPrice: propertyPrice,
  });

  const [affordability, setAffordability] = useState({
    maxHomePrice: 0,
    maxMonthlyPayment: 0,
    calculatedMonthlyPayment: 0,
    affordScore: 0,
    canAfford: false,
  });

  useEffect(() => {
    // Update property price when prop changes
    setData(prev => ({ ...prev, propertyPrice }));
  }, [propertyPrice]);

  useEffect(() => {
    calculateAffordability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const calculateAffordability = () => {
    const monthlyIncome = data.annualIncome / 12;
    const maxMonthlyPayment = monthlyIncome * 0.28 - data.monthlyDebts;
    
    // Calculate mortgage payment for the actual property
    const loanAmount = data.propertyPrice - data.downPayment;
    const monthlyRate = data.interestRate / 100 / 12;
    const numPayments = data.mortgageTerm * 12;
    
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Calculate max home price user can afford
    const maxLoanAmount = maxMonthlyPayment * 
      (Math.pow(1 + monthlyRate, numPayments) - 1) / 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
    
    const maxHomePrice = maxLoanAmount + data.downPayment;

    // Calculate afford score (0-100)
    const score = Math.min(100, Math.max(0, (maxHomePrice / data.propertyPrice) * 100));
    const canAfford = monthlyPayment <= maxMonthlyPayment;

    setAffordability({
      maxHomePrice,
      maxMonthlyPayment,
      calculatedMonthlyPayment: monthlyPayment,
      affordScore: score,
      canAfford,
    });
  };

  const getAffordabilityStatus = () => {
    if (affordability.affordScore >= 100) return { text: "Affordable", color: "success" };
    if (affordability.affordScore >= 70) return { text: "Stretching", color: "warning" };
    return { text: "Aggressive", color: "destructive" };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const status = getAffordabilityStatus();
  const updateField = (field: keyof AffordabilityData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-2 bg-card border-border">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Affordability</h2>
          <p className="text-muted-foreground">Calculate if you can afford this home</p>
        </div>

        {/* Affordability Summary */}
        <div className="bg-brand-icy-blue rounded-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">You can afford a home up to</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {formatCurrency(affordability.maxHomePrice)}
                </span>
                <span className="text-lg text-muted-foreground">
                  or {formatCurrency(affordability.maxMonthlyPayment)}/mo
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property at {formatCurrency(data.propertyPrice)}</span>
              <span className="text-foreground font-medium">
                {formatCurrency(affordability.calculatedMonthlyPayment)}/mo
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium">Afford Score™</span>
              <span className={`text-sm font-bold ${
                status.color === 'success' ? 'text-green-600' :
                status.color === 'warning' ? 'text-orange-500' :
                'text-red-600'
              }`}>
                {Math.round(affordability.affordScore)}
              </span>
            </div>
            {/* Affordability Scale */}
            <div className="relative pt-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="h-2 w-full rounded-full overflow-hidden bg-muted">
                    <div className="h-full flex">
                      <div className="w-1/3 bg-red-600"></div>
                      <div className="w-1/3 bg-orange-500"></div>
                      <div className="w-1/3 bg-green-600"></div>
                    </div>
                  </div>
                  <div 
                    className="absolute top-0 w-6 h-6 bg-foreground rounded-full border-2 border-background shadow-lg transition-all duration-300 -translate-y-2"
                    style={{ left: `calc(${Math.min(100, affordability.affordScore)}% - 12px)` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(affordability.maxMonthlyPayment)}/mo
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Aggressive</span>
                <span>Stretching</span>
                <span>Affordable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Financial Profile & Affordability Coach */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Profile Card */}
          <div className="bg-white lg:col-span-2 rounded-xl border border-gray-200 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-bold text-gray-900">Financial Profile</h3>
            </div>

            {/* Input Fields Grid - 2 rows x 3 columns */}
            <div className="grid grid-cols-3 gap-6">
              {/* Row 1 */}
              <div className="space-y-2">
                <label htmlFor="annualIncome" className="text-sm font-medium text-gray-700">
                  Annual Income
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">$</span>
                  <Input
                    id="annualIncome"
                    type="number"
                    value={data.annualIncome}
                    onChange={(e) => updateField('annualIncome', e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white pl-8 pr-4 text-base focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="interestRate" className="text-sm font-medium text-gray-700">
                  Interest Rate
                </label>
                <div className="relative">
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={data.interestRate}
                    onChange={(e) => updateField('interestRate', e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white pl-4 pr-8 text-base focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="monthlyDebts" className="text-sm font-medium text-gray-700">
                  Monthly Debts
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">$</span>
                  <Input
                    id="monthlyDebts"
                    type="number"
                    value={data.monthlyDebts}
                    onChange={(e) => updateField('monthlyDebts', e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white pl-8 pr-4 text-base focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="space-y-2">
                <label htmlFor="mortgageTerm" className="text-sm font-medium text-gray-700">
                  Loan Term
                </label>
                <Select
                  value={data.mortgageTerm.toString()}
                  onValueChange={(value) => updateField('mortgageTerm', value)}
                >
                  <SelectTrigger id="mortgageTerm" className="h-12 rounded-lg border border-gray-300 bg-white text-base focus:border-secondary focus:ring-1 focus:ring-secondary">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="25">25 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="downPayment" className="text-sm font-medium text-gray-700">
                  Down Payment
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">$</span>
                  <Input
                    id="downPayment"
                    type="number"
                    value={data.downPayment}
                    onChange={(e) => updateField('downPayment', e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white pl-8 pr-4 text-base focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="propertyPrice" className="text-sm font-medium text-gray-700">
                  Property Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">$</span>
                  <Input
                    id="propertyPrice"
                    type="number"
                    value={data.propertyPrice}
                    onChange={(e) => updateField('propertyPrice', e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white pl-8 pr-4 text-base focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Affordability Coach Card */}
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Affordability Coach</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 ml-11">Tips to increase your budget</p>

            {/* Recommendations */}
            <div className="space-y-3">
              {affordability.canAfford ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-900">
                    ✓ This property is within your comfortable price range
                  </p>
                </div>
              ) : (
                <>
                  {affordability.maxHomePrice < data.propertyPrice && (
                    <div className="bg-white rounded-xl border border-orange-200 p-4">
                      <p className="text-xs text-gray-900">
                        <strong className="font-semibold">Down Payment:</strong> Increase to{' '}
                        <span className="text-orange-600 font-semibold">
                          {formatCurrency(data.propertyPrice - affordability.maxHomePrice + data.downPayment)}
                        </span>
                        <span className="text-gray-500">
                          {' '}({formatCurrency(data.propertyPrice - affordability.maxHomePrice)} more)
                        </span>
                      </p>
                    </div>
                  )}
                  {data.annualIncome * 0.28 / 12 < affordability.calculatedMonthlyPayment && (
                    <div className="bg-white rounded-xl border border-orange-200 p-4">
                      <p className="text-xs text-gray-900">
                        <strong className="font-semibold">Income:</strong> Increase to{' '}
                        <span className="text-orange-600 font-semibold">
                          {formatCurrency((affordability.calculatedMonthlyPayment * 12) / 0.28)}
                        </span>
                        <span className="text-gray-500">
                          {' '}({formatCurrency((affordability.calculatedMonthlyPayment * 12) / 0.28 - data.annualIncome)} more)
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffordabilityCalculator;

