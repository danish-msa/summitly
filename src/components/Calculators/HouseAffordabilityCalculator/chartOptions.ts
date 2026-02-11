import { formatCurrency } from './utils';
import { AmortizationScheduleEntry, PaymentBreakdownItem } from './types';

type ScheduleType = AmortizationScheduleEntry[];

// Pie chart option generator
export const getPieChartOption = (
  data: PaymentBreakdownItem[],
  title: string
) => {
  return {
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number; percent: number }) => {
        return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
      textStyle: {
        color: "#1f2937",
      },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        return item ? `${name} (${item.percentage?.toFixed(1)}%)` : name;
      },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{d}%",
          color: "#1f2937",
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color,
          },
        })),
      },
    ],
  };
};

// Amortization chart option generator
export const getAmortizationChartOption = (schedule: ScheduleType) => {
  if (schedule.length === 0) {
    return {
      title: { text: "No Data Available", left: "center" },
    };
  }

  // For longer loans, show first 12 months, then yearly, then every 5 years
  let displaySchedule = schedule;
  if (schedule.length > 24) {
    const firstYear = schedule.slice(0, 12);
    const yearlyData: ScheduleType = [];
    for (let i = 11; i < schedule.length; i += 12) {
      if (i < schedule.length) yearlyData.push(schedule[i]);
    }
    displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
  }

  const months = displaySchedule.map(s => s.month);
  const interestData = displaySchedule.map(s => s.interestPaid);
  const principalData = displaySchedule.map(s => s.principalPaid);
  const balanceData = displaySchedule.map(s => s.remainingBalance);

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: (params: Array<{ seriesName: string; value: number; axisValue: number }>) => {
        const scheduleItem = displaySchedule.find(s => s.month === params[0].axisValue);
        if (!scheduleItem) return "";
        
        return `
          <strong>Month ${scheduleItem.month}</strong><br/>
          Total Payment: ${formatCurrency(scheduleItem.totalPayment)}<br/>
          Principal: ${formatCurrency(scheduleItem.principalPaid)}<br/>
          Interest: ${formatCurrency(scheduleItem.interestPaid)}<br/>
          Remaining Balance: ${formatCurrency(scheduleItem.remainingBalance)}
        `;
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    legend: {
      data: ["Principal", "Interest", "Remaining Balance"],
      top: 30,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months,
      name: "Month",
    },
    yAxis: [
      {
        type: "value",
        name: "Amount ($)",
        position: "left",
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      {
        type: "value",
        name: "Balance ($)",
        position: "right",
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
    ],
    series: [
      {
        name: "Principal",
        type: "bar",
        stack: "payment",
        data: principalData,
        itemStyle: {
          color: "#10b981",
        },
      },
      {
        name: "Interest",
        type: "bar",
        stack: "payment",
        data: interestData,
        itemStyle: {
          color: "#ef4444",
        },
      },
      {
        name: "Remaining Balance",
        type: "line",
        yAxisIndex: 1,
        data: balanceData,
        itemStyle: {
          color: "#3b82f6",
        },
        lineStyle: {
          width: 2,
        },
        symbol: "circle",
        symbolSize: 4,
      },
    ],
  };
};

// Principal vs Interest chart option generator
export const getPrincipalVsInterestChartOption = (schedule: ScheduleType) => {
  if (schedule.length === 0) {
    return {
      title: { text: "No Data Available", left: "center" },
    };
  }

  // For longer loans, sample data intelligently
  let displaySchedule = schedule;
  if (schedule.length > 360) {
    // For 30-year loans, show first year, then every year
    const firstYear = schedule.slice(0, 12);
    const yearlyData: ScheduleType = [];
    for (let i = 11; i < schedule.length; i += 12) {
      if (i < schedule.length) yearlyData.push(schedule[i]);
    }
    displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
  } else if (schedule.length > 24) {
    // For shorter loans, show first 12 months, then yearly
    const firstYear = schedule.slice(0, 12);
    const yearlyData: ScheduleType = [];
    for (let i = 11; i < schedule.length; i += 12) {
      if (i < schedule.length) yearlyData.push(schedule[i]);
    }
    displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
  }

  const months = displaySchedule.map(s => s.month);
  const cumulativePrincipal = displaySchedule.map(s => s.cumulativePrincipal);
  const cumulativeInterest = displaySchedule.map(s => s.cumulativeInterest);

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: (params: Array<{ seriesName: string; value: number; axisValue: number; color: string }>) => {
        const scheduleItem = displaySchedule.find(s => s.month === params[0].axisValue);
        if (!scheduleItem) return "";
        
        const principalPercent = scheduleItem.cumulativePrincipal > 0
          ? ((scheduleItem.cumulativePrincipal / (scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)) * 100).toFixed(1)
          : "0.0";
        const interestPercent = scheduleItem.cumulativeInterest > 0
          ? ((scheduleItem.cumulativeInterest / (scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)) * 100).toFixed(1)
          : "0.0";
        
        return `
          <strong>Month ${scheduleItem.month}</strong><br/>
          Cumulative Principal: ${formatCurrency(scheduleItem.cumulativePrincipal)} (${principalPercent}%)<br/>
          Cumulative Interest: ${formatCurrency(scheduleItem.cumulativeInterest)} (${interestPercent}%)<br/>
          Total Paid: ${formatCurrency(scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)}
        `;
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    legend: {
      data: ["Cumulative Principal", "Cumulative Interest"],
      top: 30,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months,
      name: "Month",
    },
    yAxis: {
      type: "value",
      name: "Cumulative Amount ($)",
      axisLabel: {
        formatter: (value: number) => formatCurrency(value),
      },
    },
    series: [
      {
        name: "Cumulative Principal",
        type: "line",
        data: cumulativePrincipal,
        itemStyle: {
          color: "#10b981",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
              { offset: 1, color: "rgba(16, 185, 129, 0.05)" },
            ],
          },
        },
        lineStyle: {
          width: 3,
        },
        symbol: "circle",
        symbolSize: 4,
        smooth: true,
      },
      {
        name: "Cumulative Interest",
        type: "line",
        data: cumulativeInterest,
        itemStyle: {
          color: "#ef4444",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(239, 68, 68, 0.3)" },
              { offset: 1, color: "rgba(239, 68, 68, 0.05)" },
            ],
          },
        },
        lineStyle: {
          width: 3,
        },
        symbol: "circle",
        symbolSize: 4,
        smooth: true,
      },
    ],
  };
};

