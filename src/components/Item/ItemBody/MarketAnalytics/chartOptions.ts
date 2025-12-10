import type { ChartParam, MarketData, ListingsData, SoldPriceData } from './types';

/**
 * Create main market chart option (Median & Average Sold Price)
 */
export const createMarketChartOption = (data: MarketData) => {
  if (!data.months.length || !data.prices.length || !data.days.length) {
    return {};
  }

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '18%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#64748b',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      padding: [8, 12],
      axisPointer: {
        type: 'line' as const,
        lineStyle: {
          color: '#64748b',
          width: 2,
          type: 'dashed' as const,
        },
        shadowStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      formatter: (params: ChartParam[] | ChartParam) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        if (paramsArray.length === 0) return '';
        const firstParam = paramsArray[0] as ChartParam;
        const period = firstParam.axisValue || '';
        let tooltipContent = `<div style="font-weight: 600; margin-bottom: 8px;">${period}</div>`;
        
        paramsArray.forEach((param: ChartParam) => {
          const value = `$${(param.value / 1000).toFixed(0)}K`;
          const color = param.color || '#000';
          tooltipContent += `
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span style="color: ${color}; font-weight: 600;">${param.seriesName}:</span>
              <span style="color: #fff; margin-left: 6px; font-weight: 700;">${value}</span>
            </div>
          `;
        });
        
        return tooltipContent;
      },
    },
    legend: {
      data: ['Median Sold Price', 'Average Sold Price'],
      top: 10,
      textStyle: {
        color: '#64748b',
        fontSize: 12,
      },
      itemGap: 20,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        interval: 1,
        rotate: 45,
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
          width: 1,
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: '${value}K',
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          width: 1,
          type: 'dashed' as const,
        },
      },
    },
    series: [
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        data: data.prices,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#fff',
          borderWidth: 2,
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
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
      {
        name: 'Average Sold Price',
        type: 'line' as const,
        data: data.days, // This is actually average prices now
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#0d9488',
          width: 2,
        },
        itemStyle: {
          color: '#0d9488',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(13, 148, 136, 0.3)' },
              { offset: 1, color: 'rgba(13, 148, 136, 0.05)' },
            ],
          },
        },
      },
    ],
  };
};

/**
 * Create listings chart option (New/Closed Listings)
 */
export const createListingsChartOption = (data: ListingsData) => {
  if (!data.months.length || !data.newListings.length || !data.closedListings.length) {
    return {};
  }

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '18%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#64748b',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      padding: [8, 12],
      axisPointer: {
        type: 'line' as const,
        lineStyle: {
          color: '#64748b',
          width: 2,
          type: 'dashed' as const,
        },
        shadowStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      formatter: (params: ChartParam[] | ChartParam) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        if (paramsArray.length === 0) return '';
        const firstParam = paramsArray[0] as ChartParam;
        const period = firstParam.axisValue || '';
        let tooltipContent = `<div style="font-weight: 600; margin-bottom: 8px;">${period}</div>`;
        
        paramsArray.forEach((param: ChartParam) => {
          const color = param.color || '#000';
          tooltipContent += `
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span style="color: ${color}; font-weight: 600;">${param.seriesName}:</span>
              <span style="color: #fff; margin-left: 6px; font-weight: 700;">${param.value} listings</span>
            </div>
          `;
        });
        
        return tooltipContent;
      },
    },
    legend: {
      data: ['New Listings', 'Closed Listings'],
      top: 10,
      textStyle: {
        color: '#64748b',
        fontSize: 12,
      },
      itemGap: 20,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        interval: 1,
        rotate: 45,
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
          width: 1,
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: '${value}',
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          width: 1,
          type: 'dashed' as const,
        },
      },
    },
    series: [
      {
        name: 'New Listings',
        type: 'line' as const,
        data: data.newListings,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#fff',
          borderWidth: 2,
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
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
      {
        name: 'Closed Listings',
        type: 'line' as const,
        data: data.closedListings,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#ef4444',
          width: 2,
        },
        itemStyle: {
          color: '#ef4444',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
            ],
          },
        },
      },
    ],
  };
};

/**
 * Create sold price chart option (Median/Average Sold Price)
 */
export const createSoldPriceChartOption = (data: SoldPriceData) => {
  if (!data.months.length || !data.medianPrices.length || !data.averagePrices.length) {
    return {};
  }

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '18%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#64748b',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      padding: [8, 12],
      axisPointer: {
        type: 'line' as const,
        lineStyle: {
          color: '#64748b',
          width: 2,
          type: 'dashed' as const,
        },
        shadowStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      formatter: (params: ChartParam[] | ChartParam) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        if (paramsArray.length === 0) return '';
        const firstParam = paramsArray[0] as ChartParam;
        const period = firstParam.axisValue || '';
        let tooltipContent = `<div style="font-weight: 600; margin-bottom: 8px;">${period}</div>`;
        
        paramsArray.forEach((param: ChartParam) => {
          const value = `$${(param.value / 1000).toFixed(0)}K`;
          const color = param.color || '#000';
          tooltipContent += `
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span style="color: ${color}; font-weight: 600;">${param.seriesName}:</span>
              <span style="color: #fff; margin-left: 6px; font-weight: 700;">${value}</span>
            </div>
          `;
        });
        
        return tooltipContent;
      },
    },
    legend: {
      data: ['Median Sold Price', 'Average Sold Price'],
      top: 10,
      textStyle: {
        color: '#64748b',
        fontSize: 12,
      },
      itemGap: 20,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLabel: {
        interval: 1,
        rotate: 45,
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
          width: 1,
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: '${value}K',
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          width: 1,
          type: 'dashed' as const,
        },
      },
    },
    series: [
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        data: data.medianPrices,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#22c55e',
          width: 2,
        },
        itemStyle: {
          color: '#22c55e',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' },
            ],
          },
        },
      },
      {
        name: 'Average Sold Price',
        type: 'line' as const,
        data: data.averagePrices,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: '#a855f7',
          width: 2,
        },
        itemStyle: {
          color: '#a855f7',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 85, 247, 0.3)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0.05)' },
            ],
          },
        },
      },
    ],
  };
};

