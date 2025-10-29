"use client";

import { useMemo } from 'react';
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

interface YearlyData {
  year: number;
  buyCost: number;
  rentCost: number;
  buyEquity: number;
  rentInvestment: number;
}

interface RentVsBuyChartProps {
  data: YearlyData[];
}

const RentVsBuyChart = ({ data }: RentVsBuyChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const option = useMemo(() => {
    const years = data.map(d => d.year);
    const buyCosts = data.map(d => Math.round(d.buyCost / 1000)); // Convert to thousands
    const rentCosts = data.map(d => Math.round(d.rentCost / 1000));
    const buyEquities = data.map(d => Math.round((d.buyEquity) / 1000));
    const rentInvestments = data.map(d => Math.round(d.rentInvestment / 1000));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
          const paramsArray = Array.isArray(params) ? params : [params];
          const year = (paramsArray[0]?.axisValue as number) || 1;
          const yearData = data[year - 1];
          let tooltip = `<strong>Year ${year}</strong><br/>`;
          
          paramsArray.forEach((param) => {
            if (param.seriesName === 'Buy Cost') {
              tooltip += `Buy Cost: ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(yearData.buyCost)}<br/>`;
            } else if (param.seriesName === 'Rent Cost') {
              tooltip += `Rent Cost: ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(yearData.rentCost)}<br/>`;
            } else if (param.seriesName === 'Buy Equity') {
              tooltip += `Buy Equity: ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(yearData.buyEquity)}<br/>`;
            } else if (param.seriesName === 'Rent Investment') {
              tooltip += `Rent Investment: ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(yearData.rentInvestment)}<br/>`;
            }
          });
          
          return tooltip;
        },
      },
      legend: {
        data: ['Buy Cost', 'Rent Cost', 'Buy Equity', 'Rent Investment'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years,
        name: 'Years',
      },
      yAxis: {
        type: 'value',
        name: 'Cost (thousands $)',
        axisLabel: {
          formatter: (value: number) => `$${value}k`,
        },
      },
      series: [
        {
          name: 'Buy Cost',
          type: 'line',
          data: buyCosts,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
          smooth: true,
        },
        {
          name: 'Rent Cost',
          type: 'line',
          data: rentCosts,
          lineStyle: {
            color: '#10b981',
            width: 2,
          },
          itemStyle: {
            color: '#10b981',
          },
          smooth: true,
        },
        {
          name: 'Buy Equity',
          type: 'line',
          data: buyEquities,
          lineStyle: {
            color: '#8b5cf6',
            width: 2,
            type: 'dashed',
          },
          itemStyle: {
            color: '#8b5cf6',
          },
          smooth: true,
        },
        {
          name: 'Rent Investment',
          type: 'line',
          data: rentInvestments,
          lineStyle: {
            color: '#f59e0b',
            width: 2,
            type: 'dashed',
          },
          itemStyle: {
            color: '#f59e0b',
          },
          smooth: true,
        },
      ],
    };
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Set option
    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [option]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
  );
};

export default RentVsBuyChart;

