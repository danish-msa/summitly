import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { estimateData } from './mockData';
import { formatCurrency, formatYAxis } from './utils';

interface EstimateHistorySectionProps {
  propertyAddress: string;
}

export default function EstimateHistorySection({ propertyAddress }: EstimateHistorySectionProps) {
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(estimateData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = estimateData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => [...estimateData].reverse(), []);

  // Prepare chart option for echarts with modern styling
  const chartOption = useMemo(() => ({
    animation: true,
    animationDuration: 1500,
    animationEasing: 'cubicOut' as const,
    grid: {
      top: 30,
      right: 30,
      bottom: 40,
      left: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: chartData.map(item => item.date),
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
        margin: 12,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: 500,
        formatter: (value: number) => formatYAxis(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed' as const,
          width: 1,
          opacity: 0.6,
        },
      },
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: '#1e293b',
        fontSize: 13,
      },
      shadowBlur: 20,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffsetY: 4,
      formatter: (params: unknown) => {
        const paramsArray = params as Array<{ value: number; name: string }>;
        const data = paramsArray[0];
        const month = chartData.find(item => item.value === data.value)?.month || data.name;
        return `
          <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 6px;">${month}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);"></span>
            <span style="font-weight: 600; font-size: 16px; color: #1e293b;">${formatCurrency(data.value)}</span>
          </div>
        `;
      },
      axisPointer: {
        type: 'line' as const,
        lineStyle: {
          color: '#6366f1',
          width: 2,
          type: 'solid' as const,
        },
        shadowStyle: {
          color: 'rgba(99, 102, 241, 0.1)',
        },
      },
    },
    series: [
      {
        name: 'Estimated Value',
        type: 'line' as const,
        data: chartData.map(item => item.value),
        smooth: 0.6,
        symbol: 'circle' as const,
        symbolSize: 6,
        showSymbol: false,
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            color: '#6366f1',
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 12,
            shadowColor: 'rgba(99, 102, 241, 0.6)',
          },
          symbolSize: 10,
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
                color: 'rgba(99, 102, 241, 0.3)',
              },
              {
                offset: 0.5,
                color: 'rgba(139, 92, 246, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(99, 102, 241, 0.05)',
              },
            ],
          },
        },
        lineStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              {
                offset: 0,
                color: '#6366f1',
              },
              {
                offset: 1,
                color: '#8b5cf6',
              },
            ],
          },
          width: 3,
          shadowBlur: 8,
          shadowColor: 'rgba(99, 102, 241, 0.3)',
        },
        itemStyle: {
          color: '#6366f1',
          borderColor: '#fff',
          borderWidth: 2,
        },
        markPoint: {
          data: [
            {
              type: 'max' as const,
              name: 'Maximum',
              symbol: 'circle' as const,
              symbolSize: 60,
              itemStyle: {
                color: 'rgba(99, 102, 241, 0.1)',
              },
              label: {
                show: false,
              },
            },
          ],
        },
      },
    ],
  }), [chartData]);

  return (
    <div className="mt-8 p-6">
      <div className="mb-6">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Estimate History</h2>
        <p className="text-sm text-gray-600">
          Estimate history of <span className="text-gray-900 font-medium">{propertyAddress}</span>
        </p>
      </div>

      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[350px_1fr]">
          {/* Left Panel - Value List */}
          <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-200 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Estimated Home Value</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <div
                  key={`${startIndex + index}-${item.month}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{item.month}</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 border-t border-gray-200 p-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Chart */}
          <div className="p-6">
            <ReactECharts
              option={chartOption}
              style={{ height: '400px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

