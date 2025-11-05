import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, TrendingUp } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';

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

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="annualIncome">Annual Income</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      <p>Your total annual gross income</p>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="annualIncome"
                type="number"
                value={data.annualIncome}
                onChange={(e) => updateField('annualIncome', e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="interestRate">Interest Rate</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      <p>Annual interest rate for your mortgage</p>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={data.interestRate}
                onChange={(e) => updateField('interestRate', e.target.value)}
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="monthlyDebts">Monthly Debts</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      <p>Total monthly debt payments (car loans, credit cards, etc.)</p>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monthlyDebts"
                type="number"
                value={data.monthlyDebts}
                onChange={(e) => updateField('monthlyDebts', e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mortgageTerm">Mortgage free in</Label>
            <Select
              value={data.mortgageTerm.toString()}
              onValueChange={(value) => updateField('mortgageTerm', value)}
            >
              <SelectTrigger id="mortgageTerm">
                <SelectValue />
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
            <div className="flex items-center gap-2">
              <Label htmlFor="downPayment">Down Payment</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      <p>Amount you plan to put down</p>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="downPayment"
                type="number"
                value={data.downPayment}
                onChange={(e) => updateField('downPayment', e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="propertyPrice">Property Price</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      <p>The price of this property</p>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="propertyPrice"
                type="number"
                value={data.propertyPrice}
                onChange={(e) => updateField('propertyPrice', e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {/* Affordability Coach */}
        <div className="bg-brand-icy-blue rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Affordability Coach</h3>
          </div>
          <ul className="space-y-2">
            {affordability.canAfford ? (
              <li className="text-sm text-foreground">
                ✓ This property is within your comfortable price range
              </li>
            ) : (
              <>
                {affordability.maxHomePrice < data.propertyPrice && (
                  <li className="text-sm text-foreground">
                    <strong>Down Payment:</strong> Increase to {formatCurrency(data.propertyPrice - affordability.maxHomePrice + data.downPayment)} 
                    <span className="text-muted-foreground"> ({formatCurrency(data.propertyPrice - affordability.maxHomePrice)} more)</span>
                  </li>
                )}
                {data.annualIncome * 0.28 / 12 < affordability.calculatedMonthlyPayment && (
                  <li className="text-sm text-foreground">
                    <strong>Income:</strong> Increase to {formatCurrency((affordability.calculatedMonthlyPayment * 12) / 0.28)} 
                    <span className="text-muted-foreground"> ({formatCurrency((affordability.calculatedMonthlyPayment * 12) / 0.28 - data.annualIncome)} more)</span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AffordabilityCalculator;

