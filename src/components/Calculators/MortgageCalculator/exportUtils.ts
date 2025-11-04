import { toast } from "sonner";
import { formatCurrency } from "./utils";
import { AmortizationScheduleEntry } from "./types";

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

// Utility function to download chart as PNG (for AmortizationChart component)
export const downloadChartAsPNG = (chartElement: HTMLElement | null, _filename: string) => {
  if (!chartElement) {
    toast.error("Chart not available for download");
    return;
  }
  
  try {
    // Use html2canvas or similar library to convert chart to PNG
    // For now, we'll use a simpler approach with canvas
    // Note: This requires html2canvas library or similar
    
    // Temporary solution: inform user that chart export needs html2canvas
    toast.error("Chart export requires additional setup. Please use table export for now.");
    console.warn("Chart PNG export requires html2canvas library");
  } catch (error) {
    console.error('Error downloading chart:', error);
    toast.error("Failed to download chart");
  }
};

// Prepare table data for Amortization Schedule CSV export
export const prepareAmortizationTableData = (schedule: AmortizationScheduleEntry[]) => {
  const tableData = schedule.map(entry => ({
    "Payment #": entry.payment,
    "Payment Amount": formatCurrency(entry.totalPayment),
    "Principal": formatCurrency(entry.principal),
    "Interest": formatCurrency(entry.interest),
    "Balance": formatCurrency(entry.balance)
  }));

  return tableData;
};

