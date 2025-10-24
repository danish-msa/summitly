import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MortgageCalculator = () => {
  const [price, setPrice] = useState(500000);
  const [rate, setRate] = useState(5.5);
  const [amortization, setAmortization] = useState(25);
  const [downPayment, setDownPayment] = useState(20);

  const [results, setResults] = useState({
    totalDownPayment: 0,
    totalMortgageAmount: 0,
    totalInterestPayment: 0,
    totalPurchaseCost: 0,
    monthlyPayment: 0,
  });

  useEffect(() => {
    calculateMortgage();
  }, [price, rate, amortization, downPayment]);

  const calculateMortgage = () => {
    const downPaymentAmount = (price * downPayment) / 100;
    const mortgageAmount = price - downPaymentAmount;
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = amortization * 12;

    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment =
        (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = mortgageAmount / numberOfPayments;
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - mortgageAmount;
    const totalCost = totalPayment + downPaymentAmount;

    setResults({
      totalDownPayment: downPaymentAmount,
      totalMortgageAmount: mortgageAmount,
      totalInterestPayment: totalInterest,
      totalPurchaseCost: totalCost,
      monthlyPayment: monthlyPayment,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Calculator Section - Left */}
        <Card className="w-[60%] border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Mortgage Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Property Price - Both Input and Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-2/3">
                  <Label className="text-sm font-medium">Property Price</Label>
                </div>
                <div className="w-1/3">
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="pl-7"
                    placeholder="Enter property price"
                  />
                </div>
                
              </div>
              
              
              {/* Slider */}
              <Slider
                value={[price]}
                onValueChange={(value) => setPrice(value[0])}
                min={100000}
                max={2000000}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>$100K</span>
                <span>$2M</span>
              </div>
            </div>

            {/* Interest Rate and Amortization in One Row */}
            <div className="flex justify-between gap-8">
              {/* Interest Rate */}
              <div className="space-y-4 w-1/2">
                <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Interest Rate</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary">{rate}%</span>
                      <span className="text-xs text-gray-500">({formatCurrency(price * rate / 100)})</span>
                    </div>
                </div>
                
                {/* Slider */}
                <Slider
                  value={[rate]}
                  onValueChange={(value) => setRate(value[0])}
                  min={1}
                  max={15}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Amortization */}
              <div className="space-y-4 w-1/2">
                <Label className="text-sm font-medium">Amortization Period</Label>
                <Select value={amortization.toString()} onValueChange={(value) => setAmortization(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select amortization period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="20">20 years</SelectItem>
                    <SelectItem value="25">25 years</SelectItem>
                    <SelectItem value="30">30 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-2/3">
                  <Label className="text-sm font-medium">Down Payment</Label>
                </div>
                <div className="w-1/3">
                    <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-primary">{downPayment}%</span>
                    <span className="text-xs text-gray-500">({formatCurrency(price * downPayment / 100)})</span>
                  </div>
                </div>
              </div>
              <Slider
                value={[downPayment]}
                onValueChange={(value) => setDownPayment(value[0])}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>5%</span>
                <span>50%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section - Right */}
        <Card className="w-[40%] border-none bg-brand-icy-blue">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Mortgage Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Detailed Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Monthly Payment</span>
                <span className="text-base font-bold text-primary">{formatCurrency(results.monthlyPayment)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Down Payment</span>
                <span className="text-base text-primary">{formatCurrency(results.totalDownPayment)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Mortgage Amount</span>
                <span className="text-base text-primary">{formatCurrency(results.totalMortgageAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Total Interest</span>
                <span className="text-base text-red-600">{formatCurrency(results.totalInterestPayment)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 bg-brand-glacier rounded-lg px-3">
                <span className="text-gray-900 font-semibold text-sm">Total Cost</span>
                <span className="text-base font-bold text-primary">{formatCurrency(results.totalPurchaseCost)}</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-brand-tide rounded-lg p-3">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Quick Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Higher down payment reduces monthly payments</li>
                <li>• Shorter amortization saves on interest</li>
                <li>• Consider property taxes and insurance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
