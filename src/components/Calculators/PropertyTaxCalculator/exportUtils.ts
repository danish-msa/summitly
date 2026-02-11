import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import { TaxCalculationResult } from "./types";
import { formatCurrency } from "./utils";

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

// Prepare table data for Overall Tax Structure CSV export
export const prepareOverallTaxTableData = (taxCalculation: TaxCalculationResult) => {
  const tableData = [
    {
      "Tax Component": "City Tax",
      "Amount": formatCurrency(taxCalculation.cityLevy),
      "Tax Rate (%)": taxCalculation.rates.cityRate.toFixed(6),
      "% of Total Taxes": `${taxCalculation.percentages.cityTaxPercentageOfTotal.toFixed(2)}%`,
      "% of Property Value": taxCalculation.rates.cityRate.toFixed(6)
    },
    {
      "Tax Component": "Education Tax",
      "Amount": formatCurrency(taxCalculation.educationLevy),
      "Tax Rate (%)": taxCalculation.rates.educationRate.toFixed(6),
      "% of Total Taxes": `${taxCalculation.percentages.educationTaxPercentageOfTotal.toFixed(2)}%`,
      "% of Property Value": taxCalculation.rates.educationRate.toFixed(6)
    },
    {
      "Tax Component": "City Building Fund",
      "Amount": formatCurrency(taxCalculation.cityBuildingFund),
      "Tax Rate (%)": taxCalculation.rates.cityBuildingFund.toFixed(6),
      "% of Total Taxes": `${taxCalculation.percentages.cityBuildingFundPercentageOfTotal.toFixed(2)}%`,
      "% of Property Value": taxCalculation.rates.cityBuildingFund.toFixed(6)
    }
  ];

  if (taxCalculation.rebate > 0) {
    tableData.push({
      "Tax Component": "First-Time Buyer Rebate",
      "Amount": `-${formatCurrency(taxCalculation.rebate)}`,
      "Tax Rate (%)": "-",
      "% of Total Taxes": "-",
      "% of Property Value": "-"
    });
  }

  if (taxCalculation.specialCharges > 0) {
    tableData.push({
      "Tax Component": "Special Charges",
      "Amount": formatCurrency(taxCalculation.specialCharges),
      "Tax Rate (%)": "-",
      "% of Total Taxes": "-",
      "% of Property Value": "-"
    });
  }

  tableData.push({
    "Tax Component": "TOTAL TAXES",
    "Amount": formatCurrency(taxCalculation.totalTax),
    "Tax Rate (%)": taxCalculation.rates.totalRate.toFixed(6),
    "% of Total Taxes": "100.00%",
    "% of Property Value": taxCalculation.percentages.totalTaxPercentageOfPropertyValue.toFixed(6)
  });

  return tableData;
};

// Prepare table data for City Tax Breakdown CSV export
export const prepareCityBreakdownTableData = (taxCalculation: TaxCalculationResult) => {
  const tableData = taxCalculation.cityTaxBreakdown.map(item => ({
    "Service Category": item.category.replace(/([A-Z])/g, ' $1').trim(),
    "Dollar Amount": formatCurrency(item.amount),
    "% of Total City Tax": `${item.percentageOfCityTax.toFixed(2)}%`,
    "% of Property Value": item.percentageOfPropertyValue.toFixed(6),
    "% of Total Taxes Paid": `${item.percentageOfTotalTax.toFixed(2)}%`
  }));

  tableData.push({
    "Service Category": "TOTAL CITY TAX",
    "Dollar Amount": formatCurrency(taxCalculation.cityLevy),
    "% of Total City Tax": "100.00%",
    "% of Property Value": taxCalculation.rates.cityRate.toFixed(6),
    "% of Total Taxes Paid": `${taxCalculation.percentages.cityTaxPercentageOfTotal.toFixed(2)}%`
  });

  return tableData;
};

