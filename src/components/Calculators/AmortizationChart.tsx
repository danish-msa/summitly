"use client";

import ReactECharts from "echarts-for-react";

interface AmortizationChartProps {
  principal: number;
  rate: number;
  years: number;
  paymentFrequency: string;
}

const AmortizationChart = ({ principal, rate, years, paymentFrequency }: AmortizationChartProps) => {
  // Calculate number of payments based on frequency
  const getPaymentsPerYear = (frequency: string) => {
    switch (frequency) {
      case "Weekly":
      case "Accelerated Weekly":
        return 52;
      case "Bi-weekly":
      case "Accelerated Bi-weekly":
        return 26;
      case "Semi-monthly":
        return 24;
      case "Monthly":
        return 12;
      case "Quarterly":
        return 4;
      case "Annually":
        return 1;
      default:
        return 12;
    }
  };

  const paymentsPerYear = getPaymentsPerYear(paymentFrequency);
  const totalPayments = years * paymentsPerYear;
  const ratePerPeriod = rate / 100 / paymentsPerYear;
  
  // Calculate payment amount
  const payment = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPayments)) / 
                  (Math.pow(1 + ratePerPeriod, totalPayments) - 1);
  
  // Generate amortization schedule
  let balance = principal;
  const scheduleData = [];
  
  // Sample every Nth payment to keep chart readable (show ~300 data points max)
  const sampleRate = Math.max(1, Math.floor(totalPayments / 300));
  
  for (let i = 1; i <= totalPayments; i++) {
    const interestPayment = balance * ratePerPeriod;
    const principalPayment = payment - interestPayment;
    balance -= principalPayment;
    
    if (i % sampleRate === 0 || i === totalPayments) {
      scheduleData.push({
        payment: i,
        interest: interestPayment,
        principal: principalPayment,
        balance: Math.max(0, balance)
      });
    }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params: Array<{axisValue: string, seriesName: string, value: number, marker: string}>) {
        const payment = params[0].axisValue;
        let result = `Payment ${payment}<br/>`;
        params.forEach((param: {axisValue: string, seriesName: string, value: number, marker: string}) => {
          const value = new Intl.NumberFormat('en-CA', { 
            style: 'currency', 
            currency: 'CAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(param.value);
          result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Interest', 'Principal', 'Balance'],
      bottom: 0,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '80px',
      right: '40px',
      bottom: '60px',
      top: '40px'
    },
    xAxis: {
      type: 'category',
      data: scheduleData.map(d => d.payment),
      axisLabel: {
        fontSize: 11,
        interval: Math.floor(scheduleData.length / 8) // Show ~8 labels
      },
      name: 'Payment',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Balance',
        position: 'left',
        axisLabel: {
          formatter: function(value: number) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          },
          fontSize: 11
        },
        nameTextStyle: {
          fontSize: 12
        }
      },
      {
        type: 'value',
        name: 'Payment',
        position: 'right',
        axisLabel: {
          formatter: function(value: number) {
            return '$' + value.toFixed(0);
          },
          fontSize: 11
        },
        nameTextStyle: {
          fontSize: 12
        }
      }
    ],
    series: [
      {
        name: 'Interest',
        type: 'bar',
        stack: 'payment',
        yAxisIndex: 1,
        data: scheduleData.map(d => d.interest),
        itemStyle: {
          color: '#0d9488'
        },
        barMaxWidth: 30
      },
      {
        name: 'Principal',
        type: 'bar',
        stack: 'payment',
        yAxisIndex: 1,
        data: scheduleData.map(d => d.principal),
        itemStyle: {
          color: '#14b8a6'
        },
        barMaxWidth: 30
      },
      {
        name: 'Balance',
        type: 'line',
        yAxisIndex: 0,
        data: scheduleData.map(d => d.balance),
        smooth: true,
        itemStyle: {
          color: '#f97316'
        },
        lineStyle: {
          width: 2,
          color: '#f97316'
        },
        symbol: 'circle',
        symbolSize: 4
      }
    ]
  };

  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height: '400px' }} />
    </div>
  );
};

export default AmortizationChart;