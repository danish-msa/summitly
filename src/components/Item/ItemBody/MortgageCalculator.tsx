import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactECharts from "echarts-for-react";
import { Clock } from "lucide-react";

export const MortgageCalculator = () => {
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanLength, setLoanLength] = useState(25);
  // Default values: Property tax ~1.2% annually (~$500/mo for $500k home), Insurance ~$150/mo, HOA ~$300/mo
  const [monthlyPropertyTax, setMonthlyPropertyTax] = useState(500);
  const [monthlyHomeInsurance, setMonthlyHomeInsurance] = useState(150);
  const [monthlyHOA, setMonthlyHOA] = useState(300);

  const [results, setResults] = useState({
    totalDownPayment: 0,
    totalMortgageAmount: 0,
    totalInterestPayment: 0,
    totalPurchaseCost: 0,
    monthlyPayment: 0,
    monthlyPrincipalAndInterest: 0,
    totalMonthlyPayment: 0,
    monthlyPMI: 0,
  });

  const calculateMortgage = useCallback(() => {
    const downPaymentAmount = downPayment;
    const mortgageAmount = homePrice - downPaymentAmount;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanLength * 12;

    let monthlyPrincipalAndInterest = 0;
    if (monthlyRate > 0 && mortgageAmount > 0) {
      monthlyPrincipalAndInterest =
        (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else if (mortgageAmount > 0) {
      monthlyPrincipalAndInterest = mortgageAmount / numberOfPayments;
    }

    // Calculate PMI (Private Mortgage Insurance) - typically required when down payment < 20%
    // PMI is usually 0.5% to 1% of loan amount annually, we'll use 0.75% as average
    const downPaymentPercent = (downPaymentAmount / homePrice) * 100;
    const monthlyPMI = downPaymentPercent < 20 && mortgageAmount > 0 
      ? (mortgageAmount * 0.0075) / 12  // 0.75% annually divided by 12
      : 0;

    // Total monthly payment includes P&I + taxes + insurance + HOA + PMI
    const totalMonthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyHomeInsurance + monthlyHOA + monthlyPMI;

    const totalPayment = monthlyPrincipalAndInterest * numberOfPayments;
    const totalInterest = totalPayment - mortgageAmount;
    const totalCost = totalPayment + downPaymentAmount + (monthlyPropertyTax + monthlyHomeInsurance + monthlyHOA + monthlyPMI) * numberOfPayments;

    setResults({
      totalDownPayment: downPaymentAmount,
      totalMortgageAmount: mortgageAmount,
      totalInterestPayment: totalInterest,
      totalPurchaseCost: totalCost,
      monthlyPayment: monthlyPrincipalAndInterest,
      monthlyPrincipalAndInterest: monthlyPrincipalAndInterest,
      totalMonthlyPayment: totalMonthlyPayment,
      monthlyPMI: monthlyPMI,
    });
  }, [homePrice, downPayment, interestRate, loanLength, monthlyPropertyTax, monthlyHomeInsurance, monthlyHOA]);

  useEffect(() => {
    calculateMortgage();
  }, [calculateMortgage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data for pie chart with all categories
  const chartData = useMemo(() => {
    const data = [
      {
        name: 'P & I (Principal and Interest)',
        value: results.monthlyPrincipalAndInterest,
        itemStyle: { color: '#1AC0EB' }
      },
      {
        name: 'Taxes',
        value: monthlyPropertyTax,
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Insurance',
        value: monthlyHomeInsurance,
        itemStyle: { color: '#FB3748' }
      },
      {
        name: 'HOA',
        value: monthlyHOA,
        itemStyle: { color: '#1FC16B' }
      },
      {
        name: 'PMI',
        value: results.monthlyPMI,
        itemStyle: { color: '#10b981' }
      }
    ].filter(item => item.value > 0);
    return data;
  }, [results.monthlyPrincipalAndInterest, monthlyPropertyTax, monthlyHomeInsurance, monthlyHOA, results.monthlyPMI]);

  // Chart option
  const chartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: '#1e293b',
        fontSize: 13,
        fontWeight: 500,
      },
      formatter: (params: { value: number; name: string; color?: string; itemStyle?: { color?: string } }) => {
        const percentage = ((params.value / results.totalMonthlyPayment) * 100).toFixed(1);
        const color = params.color || params.itemStyle?.color || '#6366f1';
        return `
          <div style="font-weight: 600; font-size: 14px; color: #1e293b; margin-bottom: 6px;">
            ${params.name}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
            <span style="font-weight: 600; font-size: 16px; color: #1e293b;">${formatCurrency(params.value)}</span>
            <span style="color: #64748b; font-size: 12px;">(${percentage}%)</span>
          </div>
        `;
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: '10',
      itemGap: 10,
      textStyle: {
        color: '#475569',
        fontSize: 10,
        fontWeight: 500,
      },
      formatter: (name: string) => {
        const item = chartData.find(d => d.name === name);
        if (item && results.totalMonthlyPayment > 0) {
          const percentage = ((item.value / results.totalMonthlyPayment) * 100).toFixed(1);
          return `${name}: ${formatCurrency(item.value)} (${percentage}%)`;
        }
        return name;
      }
    },
    grid: {
      top: 10,
      bottom: 80,
      left: 10,
      right: 10,
    },
    series: [
      {
        name: 'Monthly Payment',
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 600,
            color: '#1e293b'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: chartData,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 100,
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '35%',
        style: {
          text: 'Total Monthly Payment',
          fontSize: 14,
          fontWeight: 700,
          fill: '#000',
          textAlign: 'center',
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: formatCurrency(results.totalMonthlyPayment),
          fontSize: 26,
          fontWeight: 700,
          fill: '#1e293b',
          textAlign: 'center',
        }
      }
    ]
  }), [chartData, results.totalMonthlyPayment]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Calculator Section - Left */}
        <div className="w-[60%] p-4 pb-12">
          {/* Header */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Mortgage Calculator</h2>
            <p className="text-muted-foreground">Calculate your monthly mortgage payments</p>
          </div>
          <div className="space-y-6 pt-4">
            {/* Home Price and Down Payment in One Row */}
            <div className="flex justify-between gap-6">
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Home Price"
                  value={homePrice}
                  onChange={(e) => setHomePrice(Number(e.target.value))}
                  className="w-full"
                  min="0"
                />
              </div>
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Down Payment"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full"
                  min="0"
                />
              </div>
            </div>

            {/* Monthly Property Tax, Loan Length, and Interest Rate in One Row */}
            <div className="flex justify-between gap-2">
              {/* Monthly Property Tax - ~50% */}
              <div className="w-[48%]">
                <Input
                  type="number"
                  label="Monthly Property Tax"
                  value={monthlyPropertyTax}
                  onChange={(e) => setMonthlyPropertyTax(Number(e.target.value))}
                  className="w-full"
                  min="0"
                />
              </div>
              <div className="flex justify-between gap-2 w-[48%]">
                {/* Loan Length - ~25% */}
                <div className="w-[50%]">
                    <Select value={loanLength.toString()} onValueChange={(value) => setLoanLength(Number(value))}>
                      <SelectTrigger className="w-full rounded-2xl border-[1.5px] border-zinc-400 h-12">
                        <SelectValue placeholder="Loan Length" />
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
                  {/* Interest Rate - ~25% */}
                  <div className="w-[50%]">
                    <Input
                      type="number"
                      label="Rate (%)"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                  </div>
              </div>
              
            </div>

            {/* Monthly Home Insurance and Monthly HOA in One Row */}
            <div className="flex justify-between gap-6">
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Monthly Home Insurance"
                  value={monthlyHomeInsurance}
                  onChange={(e) => setMonthlyHomeInsurance(Number(e.target.value))}
                  className="w-full"
                  min="0"
                />
              </div>
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Monthly HOA"
                  value={monthlyHOA}
                  onChange={(e) => setMonthlyHOA(Number(e.target.value))}
                  className="w-full"
                  min="0"
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button 
                variant="default" 
                className="w-full px-8 py-6 text-base rounded-lg gap-2"
                onClick={() => {
                  // Add handler for CTA click
                  console.log('How quickly can I get a mortgage?');
                }}
              >
                <Clock className="h-5 w-5" />
                How quickly can I get a mortgage?
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section - Right */}
        <div className="w-[40%] rounded-lg">
          
          {/* Pie Chart */}
          <div className="w-full h-[400px]">
            <ReactECharts
              option={chartOption}
              style={{ height: '450px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
