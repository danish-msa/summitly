import * as echarts from 'echarts';
import { formatFullPrice } from './helpers';

// Chart data types
export interface AverageSoldPriceData {
  months: string[];
  prices: number[]; // Average prices
  medianPrices?: number[]; // Median prices (optional for backward compatibility)
  counts: number[];
}

export interface SalesVolumeGraphData {
  months: string[];
  [propertyType: string]: string[] | number[]; // Dynamic property types
}

export interface SalesAndInventoryData {
  months: string[];
  sales: number[];
  inventory: number[];
}

export interface NewClosedAvailableData {
  months: string[];
  new: number[];
  closed: number[];
}

export interface DaysOnMarketData {
  months: string[];
  lastYear: number[];
  currentYear: number[];
}

export interface MedianListingVsSoldPriceData {
  months: string[];
  medianListingPrice: number[];
  medianSoldPrice: number[];
}

// Get Pro-Rated Month Index
export const getProRatedMonthIndex = (months: string[]): number => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  if (currentYear >= 2025 && currentMonth >= 9) {
    return 9; // Oct 25 index
  }
  return months.length - 2;
};

// Chart option for Average & Median Sold Price
export const getAverageSoldPriceChartOption = (data: AverageSoldPriceData) => {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string; dataIndex?: number };
        const dataIndex = firstParam.dataIndex !== undefined ? firstParam.dataIndex : 0;
        const count = data.counts && data.counts.length > dataIndex ? data.counts[dataIndex] : 0;
        const countText = count > 0 ? `<br/>Properties Sold: ${count.toLocaleString()}` : '';
        
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${formatFullPrice(p.value || 0)}<br/>`;
        });
        return result + countText;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['Average Sold Price', 'Median Sold Price'],
      top: '5%',
      textStyle: {
        color: '#1f2937'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: (value: number) => formatFullPrice(value),
        color: '#6b7280'
      }
    },
    series: [
      {
        name: 'Average Sold Price',
        type: 'line' as const,
        data: data.prices,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        data: data.medianPrices || [],
        smooth: true,
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  };
};

// Color palette for property types
const PROPERTY_TYPE_COLORS = [
  { light: 'rgba(239, 68, 68, 0.6)', dark: 'rgba(239, 68, 68, 0.1)', solid: '#ef4444' }, // Red
  { light: 'rgba(20, 184, 166, 0.6)', dark: 'rgba(20, 184, 166, 0.1)', solid: '#14b8a6' }, // Teal
  { light: 'rgba(59, 130, 246, 0.6)', dark: 'rgba(59, 130, 246, 0.1)', solid: '#3b82f6' }, // Blue
  { light: 'rgba(168, 85, 247, 0.6)', dark: 'rgba(168, 85, 247, 0.1)', solid: '#a855f7' }, // Purple
  { light: 'rgba(236, 72, 153, 0.6)', dark: 'rgba(236, 72, 153, 0.1)', solid: '#ec4899' }, // Pink
  { light: 'rgba(251, 146, 60, 0.6)', dark: 'rgba(251, 146, 60, 0.1)', solid: '#fb923c' }, // Orange
  { light: 'rgba(34, 197, 94, 0.6)', dark: 'rgba(34, 197, 94, 0.1)', solid: '#22c55e' }, // Green
  { light: 'rgba(234, 179, 8, 0.6)', dark: 'rgba(234, 179, 8, 0.1)', solid: '#eab308' }, // Yellow
  { light: 'rgba(99, 102, 241, 0.6)', dark: 'rgba(99, 102, 241, 0.1)', solid: '#6366f1' }, // Indigo
  { light: 'rgba(14, 165, 233, 0.6)', dark: 'rgba(14, 165, 233, 0.1)', solid: '#0ea5e9' }, // Sky
];

// Get color for property type (cycles through palette)
export const getColorForPropertyType = (index: number) => {
  return PROPERTY_TYPE_COLORS[index % PROPERTY_TYPE_COLORS.length];
};

// Chart option for Sales Volume by Property Type (Pie Chart)
export const getSalesVolumeChartOption = (data: SalesVolumeGraphData, hideLegend: boolean = false) => {
  // Extract all property types (exclude 'months')
  const allPropertyTypes = Object.keys(data).filter(key => key !== 'months');
  
  // Filter out property types that have no data (all zeros)
  const propertyTypes = allPropertyTypes.filter((propertyType) => {
    const counts = data[propertyType] as number[];
    if (!counts || counts.length === 0) return false;
    // Check if there's at least one non-zero value
    return counts.some(count => count > 0);
  });
  
  if (propertyTypes.length === 0) {
    return {
      tooltip: { trigger: 'item' as const },
      series: []
    };
  }

  // Aggregate total counts across all months for each property type
  const totalCountsByType: Array<{ name: string; value: number }> = [];
  
  propertyTypes.forEach((propertyType) => {
    const counts = data[propertyType] as number[];
    const total = counts.reduce((sum, count) => sum + (count || 0), 0);
    // Only include property types with total > 0 (strict check)
    if (total > 0) {
      totalCountsByType.push({
        name: propertyType,
        value: total
      });
    }
  });

  // Calculate grand total first to filter by percentage
  const grandTotal = totalCountsByType.reduce((sum, item) => sum + item.value, 0);
  
  // Filter out any items with value 0 or percentage < 0.1% (double check)
  const filteredCountsByType = totalCountsByType.filter(item => {
    if (item.value <= 0) return false;
    // Calculate percentage and only include if >= 0.1%
    const percent = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
    return percent >= 0.1; // Only show if percentage is at least 0.1%
  });

  if (filteredCountsByType.length === 0) {
    return {
      tooltip: { trigger: 'item' as const },
      series: []
    };
  }

  // Sort by value (descending) for better visualization
  filteredCountsByType.sort((a, b) => b.value - a.value);
  
  // Recalculate grand total with filtered data for accurate percentages
  const filteredGrandTotal = filteredCountsByType.reduce((sum, item) => sum + item.value, 0);

  // Generate pie chart data with colors (only for filtered items)
  const pieData = filteredCountsByType.map((item, index) => {
    const colors = getColorForPropertyType(index);
    return {
      name: item.name,
      value: item.value,
      itemStyle: {
        color: colors.solid
      }
    };
  });

  // Use filteredGrandTotal for percentage calculations

  return {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const param = Array.isArray(params) ? params[0] : params;
        const p = param as { name?: string; value?: number; percent?: number };
        const value = p.value || 0;
        const percent = p.percent || 0;
        return `${p.name || ''}<br/>Sales: ${value.toLocaleString()}<br/>Percentage: ${percent.toFixed(1)}%`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: hideLegend ? {
      show: false
    } : {
      type: 'scroll' as const,
      orient: 'horizontal' as const,
      top: '5%',
      left: 'center',
      textStyle: {
        color: '#1f2937'
      },
      formatter: (name: string) => {
        const item = filteredCountsByType.find(d => d.name === name);
        if (item && item.value > 0) {
          const percent = filteredGrandTotal > 0 ? ((item.value / filteredGrandTotal) * 100).toFixed(1) : '0';
          // Only show if percentage is meaningful (>= 0.1%)
          if (parseFloat(percent) >= 0.1) {
            return `${name} (${percent}%)`;
          }
        }
        return '';
      },
      data: filteredCountsByType.map(item => item.name)
    },
    series: [
      {
        name: 'Sales Volume',
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: { name?: string; percent?: number }) => {
            return `${params.name || ''}\n${params.percent?.toFixed(1) || 0}%`;
          },
          fontSize: 12,
          fontWeight: 500
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold' as const
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        data: pieData
      }
    ]
  };
};

// Chart option for Sales and Inventory
export const getSalesAndInventoryChartOption = (data: SalesAndInventoryData) => {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string };
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${p.value || 0}<br/>`;
        });
        return result;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['Sales', 'Inventory'],
      top: '5%',
      textStyle: {
        color: '#1f2937'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        color: '#6b7280'
      }
    },
    series: [
      {
        name: 'Sales',
        type: 'line' as const,
        data: data.sales,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'Inventory',
        type: 'line' as const,
        data: data.inventory,
        smooth: true,
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  };
};

// Chart option for New and Closed Properties
export const getNewClosedAvailableChartOption = (data: NewClosedAvailableData) => {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string };
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${(p.value || 0).toLocaleString()}<br/>`;
        });
        return result;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['New', 'Closed'],
      top: '5%',
      textStyle: {
        color: '#1f2937'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: (value: number) => value.toLocaleString(),
        color: '#6b7280'
      }
    },
    series: [
      {
        name: 'New',
        type: 'line' as const,
        data: data.new,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'Closed',
        type: 'line' as const,
        data: data.closed,
        smooth: true,
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  };
};

// Chart option for Days on Market
export const getDaysOnMarketChartOption = (data: DaysOnMarketData) => {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string };
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${p.value || 0} days<br/>`;
        });
        return result;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['Last Year', 'Current Year'],
      top: '5%',
      textStyle: {
        color: '#1f2937'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        color: '#6b7280',
        rotate: 0
      }
    },
    yAxis: {
      type: 'value' as const,
      name: 'Days',
      axisLabel: {
        formatter: '{value}',
        color: '#6b7280'
      }
    },
    series: [
      {
        name: 'Last Year',
        type: 'bar' as const,
        data: data.lastYear,
        itemStyle: {
          color: '#94a3b8'
        },
        barWidth: '40%'
      },
      {
        name: 'Current Year',
        type: 'bar' as const,
        data: data.currentYear,
        itemStyle: {
          color: '#3b82f6'
        },
        barWidth: '40%'
      }
    ]
  };
};

// Chart option for Median Listing Price vs Median Sold Price
export const getMedianListingVsSoldPriceChartOption = (data: MedianListingVsSoldPriceData) => {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string };
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${formatFullPrice(p.value || 0)}<br/>`;
        });
        return result;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['Median Listing Price', 'Median Sold Price'],
      top: '5%',
      textStyle: {
        color: '#1f2937'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: (value: number) => formatFullPrice(value),
        color: '#6b7280'
      }
    },
    series: [
      {
        name: 'Median Listing Price',
        type: 'line' as const,
        data: data.medianListingPrice,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        data: data.medianSoldPrice,
        smooth: true,
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  };
};

