import * as echarts from 'echarts';
import { formatPrice } from './helpers';

// Chart data types
export interface AverageSoldPriceData {
  months: string[];
  prices: number[]; // Average prices
  medianPrices?: number[]; // Median prices (optional for backward compatibility)
  counts: number[];
}

export interface SalesVolumeGraphData {
  months: string[];
  detached: number[];
  townhouse: number[];
  condo: number[];
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
          result += `${p.marker || ''}${p.seriesName || ''}: ${formatPrice(p.value || 0)}<br/>`;
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
        formatter: (value: number) => formatPrice(value),
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

// Chart option for Sales Volume by Property Type
export const getSalesVolumeChartOption = (data: SalesVolumeGraphData) => {
  const detachedPercentages = data.detached.map((detached, index) => {
    const total = detached + data.townhouse[index] + data.condo[index];
    return total > 0 ? Math.round((detached / total) * 100) : 0;
  });
  
  const townhousePercentages = data.townhouse.map((townhouse, index) => {
    const total = data.detached[index] + townhouse + data.condo[index];
    return total > 0 ? Math.round((townhouse / total) * 100) : 0;
  });
  
  const condoPercentages = data.condo.map((condo, index) => {
    const total = data.detached[index] + data.townhouse[index] + condo;
    return total > 0 ? Math.round((condo / total) * 100) : 0;
  });
  
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0] as { name?: string };
        let result = `${firstParam.name || ''}<br/>`;
        paramsArray.forEach((param) => {
          const p = param as { marker?: string; seriesName?: string; value?: number };
          result += `${p.marker || ''}${p.seriesName || ''}: ${p.value || 0}%<br/>`;
        });
        return result;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2937' }
    },
    legend: {
      data: ['Detached', 'Townhouse', 'Condo'],
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
      boundaryGap: false,
      data: data.months,
      axisLabel: {
        color: '#6b7280',
        rotate: 0
      }
    },
    yAxis: {
      type: 'value' as const,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed' as const
        }
      }
    },
    series: [
      {
        name: 'Detached',
        type: 'line' as const,
        stack: 'Total',
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.6)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
            ]
          }
        },
        lineStyle: {
          width: 0
        },
        emphasis: {
          focus: 'series' as const
        },
        data: detachedPercentages
      },
      {
        name: 'Townhouse',
        type: 'line' as const,
        stack: 'Total',
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(20, 184, 166, 0.6)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0.1)' }
            ]
          }
        },
        lineStyle: {
          width: 0
        },
        emphasis: {
          focus: 'series' as const
        },
        data: townhousePercentages
      },
      {
        name: 'Condo',
        type: 'line' as const,
        stack: 'Total',
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.6)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
            ]
          }
        },
        lineStyle: {
          width: 0
        },
        emphasis: {
          focus: 'series' as const
        },
        data: condoPercentages
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

