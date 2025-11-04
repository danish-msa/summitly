import type { ChartParam, MarketData, ListingsData, SoldPriceData } from './types';

/**
 * Create main market chart option (Price & Days on Market)
 */
export const createMarketChartOption = (data: MarketData) => {
  if (!data.months.length || !data.prices.length || !data.days.length) {
    return {};
  }

  return {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'cross' as const,
        crossStyle: {
          color: '#999',
        },
        lineStyle: {
          type: 'dashed' as const,
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937',
        fontSize: 12,
      },
      padding: 12,
      formatter: (params: ChartParam[]) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((param: ChartParam) => {
          const value = param.seriesName === 'Median Sold Price' 
            ? `$${(param.value / 1000).toFixed(0)}K`
            : `${param.value.toFixed(0)} Days`;
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 600; margin-left: auto;">${value}</span>
            </div>
          `;
        });
        return result;
      },
    },
    legend: {
      data: ['Median Sold Price', 'Average Days On Market'],
      top: '2%',
      left: 'left',
      textStyle: {
        color: '#1f2937',
        fontSize: 13,
        fontWeight: 500,
      },
      itemGap: 20,
      icon: 'circle' as const,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisPointer: {
        type: 'shadow' as const,
      },
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        interval: 11,
        rotate: 0,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: '',
        position: 'left' as const,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
        },
        splitLine: {
          lineStyle: {
            color: '#d1d5db',
            type: 'dashed' as const,
            opacity: 0.5,
          },
        },
      },
      {
        type: 'value' as const,
        name: '',
        position: 'right' as const,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => `${value.toFixed(0)} D`,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    dataZoom: [
      {
        type: 'inside' as const,
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        start: 0,
        end: 100,
        height: 20,
        bottom: '3%',
        handleIcon: 'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
        handleSize: '100%',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#3b82f6',
        },
        textStyle: {
          color: '#6b7280',
        },
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(59, 130, 246, 0.1)',
        dataBackground: {
          lineStyle: {
            color: '#d1d5db',
          },
          areaStyle: {
            color: '#f3f4f6',
          },
        },
      },
    ],
    series: [
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        yAxisIndex: 0,
        data: data.prices,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: 'rgb(0, 123, 255)',
        },
        itemStyle: {
          color: 'rgb(0, 123, 255)',
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(0, 123, 255, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(0, 123, 255, 0)',
              },
            ],
          },
        },
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(0, 123, 255)',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 123, 255, 0.5)',
          },
        },
      },
      {
        name: 'Average Days On Market',
        type: 'bar' as const,
        yAxisIndex: 1,
        data: data.days,
        barMaxWidth: 12,
        itemStyle: {
          color: 'rgb(0, 204, 102)',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(125, 211, 252)',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 204, 102, 0.5)',
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
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'cross' as const,
        crossStyle: {
          color: '#999',
        },
        lineStyle: {
          type: 'dashed' as const,
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937',
        fontSize: 12,
      },
      padding: 12,
      formatter: (params: ChartParam[]) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((param: ChartParam) => {
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 600; margin-left: auto;">${param.value} listings</span>
            </div>
          `;
        });
        return result;
      },
    },
    legend: {
      data: ['New Listings', 'Closed Listings'],
      top: '2%',
      left: 'left',
      textStyle: {
        color: '#1f2937',
        fontSize: 13,
        fontWeight: 500,
      },
      itemGap: 20,
      icon: 'circle' as const,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisPointer: {
        type: 'shadow' as const,
      },
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        interval: 0,
        rotate: 0,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Number of Listings',
      position: 'left' as const,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        formatter: (value: number) => `${value}`,
      },
      splitLine: {
        lineStyle: {
          color: '#d1d5db',
          type: 'dashed' as const,
          opacity: 0.5,
        },
      },
    },
    series: [
      {
        name: 'New Listings',
        type: 'bar' as const,
        data: data.newListings,
        barMaxWidth: 20,
        itemStyle: {
          color: 'rgb(59, 130, 246)',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(37, 99, 235)',
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)',
          },
        },
      },
      {
        name: 'Closed Listings',
        type: 'bar' as const,
        data: data.closedListings,
        barMaxWidth: 20,
        itemStyle: {
          color: 'rgb(239, 68, 68)',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(220, 38, 38)',
            shadowBlur: 10,
            shadowColor: 'rgba(239, 68, 68, 0.5)',
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
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'cross' as const,
        crossStyle: {
          color: '#999',
        },
        lineStyle: {
          type: 'dashed' as const,
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937',
        fontSize: 12,
      },
      padding: 12,
      formatter: (params: ChartParam[]) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((param: ChartParam) => {
          const price = param.value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 600; margin-left: auto;">${price}</span>
            </div>
          `;
        });
        return result;
      },
    },
    legend: {
      data: ['Median Sold Price', 'Average Sold Price'],
      top: '5%',
      textStyle: {
        color: '#6b7280',
        fontSize: 12,
      },
      itemGap: 20,
    },
    xAxis: {
      type: 'category' as const,
      data: data.months,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        interval: 0,
        rotate: 0,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Sold Price',
      position: 'left' as const,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        formatter: (value: number) => {
          return `$${(value / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: {
          color: '#d1d5db',
          type: 'dashed' as const,
          opacity: 0.5,
        },
      },
    },
    series: [
      {
        name: 'Median Sold Price',
        type: 'line' as const,
        data: data.medianPrices,
        smooth: true,
        lineStyle: {
          width: 3,
          color: 'rgb(34, 197, 94)',
        },
        itemStyle: {
          color: 'rgb(34, 197, 94)',
          borderWidth: 2,
          borderColor: '#ffffff',
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
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(22, 163, 74)',
            shadowBlur: 10,
            shadowColor: 'rgba(34, 197, 94, 0.5)',
          },
        },
      },
      {
        name: 'Average Sold Price',
        type: 'line' as const,
        data: data.averagePrices,
        smooth: true,
        lineStyle: {
          width: 3,
          color: 'rgb(168, 85, 247)',
        },
        itemStyle: {
          color: 'rgb(168, 85, 247)',
          borderWidth: 2,
          borderColor: '#ffffff',
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
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: 'rgb(147, 51, 234)',
            shadowBlur: 10,
            shadowColor: 'rgba(168, 85, 247, 0.5)',
          },
        },
      },
    ],
  };
};

