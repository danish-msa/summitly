import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import { formatCurrency } from "./utils";
import { AffordabilityResults, AmortizationScheduleEntry, PaymentBreakdownItem } from "./types";

// Utility function to download CSV file
export const downloadCSV = (data: Array<Record<string, string | number>>, filename: string) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Utility function to download chart as PNG
export const downloadChartAsPNG = (chartRef: React.RefObject<ReactECharts | null>, filename: string) => {
  if (!chartRef.current) {
    toast.error("Chart not available for download");
    return;
  }
  
  try {
    const chartInstance = chartRef.current.getEchartsInstance();
    const dataURL = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });
    
    const link = document.createElement('a');
    link.setAttribute('href', dataURL);
    link.setAttribute('download', `${filename}.png`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading chart:', error);
    toast.error("Failed to download chart");
  }
};

// Prepare table data for Monthly Payment Breakdown CSV export
export const preparePaymentBreakdownTableData = (
  paymentBreakdownData: PaymentBreakdownItem[],
  currentResults: AffordabilityResults | { principalAndInterest: number; propertyTaxes: number; insurance: number; pmi: number; hoaFees: number; total: number },
  total: number
) => {
  const tableData = paymentBreakdownData.map(item => ({
    "Payment Component": item.name,
    "Amount": formatCurrency(item.value),
    "% of Total Payment": `${item.percentage?.toFixed(1) || 0}%`
  }));

  tableData.push({
    "Payment Component": "TOTAL MONTHLY PAYMENT",
    "Amount": formatCurrency(total),
    "% of Total Payment": "100.0%"
  });

  return tableData;
};

// Prepare table data for Amortization Schedule CSV export
export const prepareAmortizationTableData = (schedule: AmortizationScheduleEntry[]): Array<Record<string, string | number>> => {
  const tableData: Array<Record<string, string | number>> = schedule.map(entry => ({
    "Month": entry.month,
    "Total Payment (P&I)": formatCurrency(entry.totalPayment),
    "Interest Paid": formatCurrency(entry.interestPaid),
    "Principal Paid": formatCurrency(entry.principalPaid),
    "Cumulative Interest": formatCurrency(entry.cumulativeInterest),
    "Cumulative Principal": formatCurrency(entry.cumulativePrincipal),
    "Remaining Balance": formatCurrency(entry.remainingBalance)
  }));

  // Add totals row if schedule has data
  if (schedule.length > 0) {
    const finalRow = schedule[schedule.length - 1];
    const totalPaid = finalRow.cumulativePrincipal + finalRow.cumulativeInterest;

    tableData.push({
      "Month": "TOTALS",
      "Total Payment (P&I)": formatCurrency(totalPaid),
      "Interest Paid": formatCurrency(finalRow.cumulativeInterest),
      "Principal Paid": formatCurrency(finalRow.cumulativePrincipal),
      "Cumulative Interest": formatCurrency(finalRow.cumulativeInterest),
      "Cumulative Principal": formatCurrency(finalRow.cumulativePrincipal),
      "Remaining Balance": "-"
    });
  }

  return tableData;
};

// Prepare table data for Principal vs Interest CSV export
export const preparePrincipalVsInterestTableData = (schedule: AmortizationScheduleEntry[]) => {
  const tableData = schedule.map(entry => {
    const totalPaid = entry.cumulativePrincipal + entry.cumulativeInterest;
    const principalPercent = totalPaid > 0 ? (entry.cumulativePrincipal / totalPaid) * 100 : 0;
    const interestPercent = totalPaid > 0 ? (entry.cumulativeInterest / totalPaid) * 100 : 0;

    return {
      "Month": entry.month,
      "Cumulative Principal": formatCurrency(entry.cumulativePrincipal),
      "Cumulative Interest": formatCurrency(entry.cumulativeInterest),
      "Total Paid": formatCurrency(totalPaid),
      "Principal %": `${principalPercent.toFixed(1)}%`,
      "Interest %": `${interestPercent.toFixed(1)}%`
    };
  });

  // Add totals row if schedule has data
  if (schedule.length > 0) {
    const finalRow = schedule[schedule.length - 1];
    const totalPaid = finalRow.cumulativePrincipal + finalRow.cumulativeInterest;
    const principalPercent = totalPaid > 0 ? (finalRow.cumulativePrincipal / totalPaid) * 100 : 0;
    const interestPercent = totalPaid > 0 ? (finalRow.cumulativeInterest / totalPaid) * 100 : 0;

    tableData.push({
      "Month": "TOTALS",
      "Cumulative Principal": formatCurrency(finalRow.cumulativePrincipal),
      "Cumulative Interest": formatCurrency(finalRow.cumulativeInterest),
      "Total Paid": formatCurrency(totalPaid),
      "Principal %": `${principalPercent.toFixed(1)}%`,
      "Interest %": `${interestPercent.toFixed(1)}%`
    });
  }

  return tableData;
};

