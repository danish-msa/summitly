import ReactECharts from "echarts-for-react";
import { SoldPriceData } from './types';
import { createSoldPriceChartOption } from './chartOptions';

interface SoldPriceChartSectionProps {
  data: SoldPriceData;
  chartKey: number;
}

export const SoldPriceChartSection = ({ data, chartKey }: SoldPriceChartSectionProps) => {
  const hasValidData = data.months.length > 0 && data.medianPrices.length > 0 && data.averagePrices.length > 0;
  const option = createSoldPriceChartOption(data);

  if (!hasValidData) {
    return (
      <div className="relative h-full w-full">
        {/* Blurred chart background */}
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
            lazyUpdate={false}
          />
        </div>
        {/* Overlay message */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center px-6 py-8">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 max-w-md">
              There isn't enough sold price data available for this location and property type to display the chart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactECharts
      key={`soldprice-${chartKey}`}
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={false}
    />
  );
};

