"use client";

import React, { useMemo } from 'react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import { ArrowDown, ArrowUp, CheckCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface ValuationData {
  lowValue: number;
  estimatedValue: number;
  highValue: number;
  lowPricePerSqFt: number;
  estimatedPricePerSqFt: number;
  highPricePerSqFt: number;
  confidence: number;
  fsd: number;
}

interface ValuationRangeProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const ValuationRange: React.FC<ValuationRangeProps> = ({ property, rawProperty }) => {
  // Extract valuation data from rawProperty or calculate from property
  const data: ValuationData = useMemo(() => {
    const estimatedValue = rawProperty?.estimate?.value || property?.listPrice || 681465;
    const lowValue = rawProperty?.estimate?.low || Math.round(estimatedValue * 0.975);
    const highValue = rawProperty?.estimate?.high || Math.round(estimatedValue * 1.025);
    const confidence = rawProperty?.estimate?.confidence || 98;
    
    // Calculate price per square foot
    const sqftValue = property?.details?.sqft;
    const squareFeet = typeof sqftValue === 'number' 
      ? sqftValue 
      : typeof sqftValue === 'string' 
        ? parseFloat(sqftValue.replace(/,/g, '')) || 2318
        : 2318;
    const lowPricePerSqFt = Math.round(lowValue / squareFeet);
    const estimatedPricePerSqFt = Math.round(estimatedValue / squareFeet);
    const highPricePerSqFt = Math.round(highValue / squareFeet);
    
    // Calculate FSD (Forecast Standard Deviation)
    const range = highValue - lowValue;
    const fsd = range / (2 * estimatedValue);

    return {
      lowValue,
      estimatedValue,
      highValue,
      lowPricePerSqFt,
      estimatedPricePerSqFt,
      highPricePerSqFt,
      confidence,
      fsd: Math.round(fsd * 100) / 100,
    };
  }, [property, rawProperty]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${Math.round(value / 1000)}K`;
  };

  // Generate bar chart data with actual values
  const chartData = useMemo(() => {
    const range = data.highValue - data.lowValue;
    const step = range / 10;
    
    // Heights creating a bell-curve distribution
    const heights = [50, 60, 72, 82, 90, 100, 92, 85, 75, 62, 52];
    
    return heights.map((height, index) => {
      const value = Math.round(data.lowValue + (step * index));
      return {
        height,
        value,
        isCenter: index === 5,
      };
    });
  }, [data]);

  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: {
      left: 10,
      right: 10,
      bottom: 10,
      top: 40,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((_, i) => i),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 120,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'none',
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(34, 184, 207, 0.3)',
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: '#fff',
        fontSize: 13,
      },
      extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24); backdrop-filter: blur(8px);',
      formatter: (params: unknown) => {
        interface TooltipParams {
          dataIndex?: number;
        }
        const param = Array.isArray(params) ? params[0] : params;
        const typedParam = param as TooltipParams;
        const dataIndex = typedParam.dataIndex ?? 0;
        const item = chartData[dataIndex];
        const isEstimate = item.isCenter;
        
        return `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isEstimate ? '#22b8cf' : '#7dd3e8'};"></div>
              <span style="font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px;">
                ${isEstimate ? 'Estimated Value' : 'Value Range'}
              </span>
            </div>
            <div style="font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.5px;">
              ${formatCurrency(item.value)}
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5);">
              ${formatShortCurrency(item.value)} per property
            </div>
          </div>
        `;
      },
    },
    series: [
      {
        type: 'bar',
        data: chartData.map((item) => ({
          value: item.height,
          itemStyle: {
            color: item.isCenter 
              ? {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#22b8cf' },
                    { offset: 1, color: '#0ea5c0' },
                  ],
                }
              : {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#7dd3e8' },
                    { offset: 1, color: '#5bc4db' },
                  ],
                },
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: item.isCenter
                ? {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: '#2dd4e8' },
                      { offset: 1, color: '#22b8cf' },
                    ],
                  }
                : {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: '#9be0f0' },
                      { offset: 1, color: '#7dd3e8' },
                    ],
                  },
              shadowColor: 'rgba(34, 184, 207, 0.4)',
              shadowBlur: 12,
              shadowOffsetY: 4,
            },
          },
          label: item.isCenter ? {
            show: true,
            position: 'top',
            formatter: formatShortCurrency(data.estimatedValue),
            color: '#22b8cf',
            fontWeight: 700,
            fontSize: 13,
            distance: 8,
          } : { show: false },
        })),
        barWidth: '75%',
        barCategoryGap: '8%',
      },
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [chartData, data.estimatedValue]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-card rounded-2xl p-6 space-y-6">
      {/* Value Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Low Value Card */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowDown className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Low</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.lowValue)}</p>
            <p className="text-sm text-muted-foreground">${data.lowPricePerSqFt}/ft²</p>
          </div>
        </div>

        {/* Estimated Value Card */}
        <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-secondary fill-secondary/20" />
            <span className="text-sm font-medium text-primary">Estimated Value</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.estimatedValue)}</p>
            <p className="text-sm text-muted-foreground">${data.estimatedPricePerSqFt}/ft²</p>
          </div>
        </div>

        {/* High Value Card */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowUp className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">High</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.highValue)}</p>
            <p className="text-sm text-muted-foreground">${data.highPricePerSqFt}/ft²</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="space-y-4 relative z-0">
        <div className="h-52 relative z-0 overflow-hidden">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* Estimated Value Label */}
        <div className="text-center space-y-2">
          <h3 className="text-base font-semibold text-foreground">Estimated Value</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-primary">High Confidence</span>
            <span className="text-sm text-muted-foreground">{data.confidence}%</span>
          </div>
          <p className="text-xs text-muted-foreground">FSD: {data.fsd}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          The forecast standard deviation (FSD) is a statistical estimate of model uncertainty. It is a quantity used
          to create the upper and lower bounds on the value estimate. The value range represents the quantity such that the
          range will actually capture the subsequent arm's-length sale price approximately 68% of the time (one standard
          deviation).
        </p>
      </div>
    </div>
  );
};

export default ValuationRange;
