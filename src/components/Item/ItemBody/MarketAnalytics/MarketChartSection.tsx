import ReactECharts from "echarts-for-react";
import { MarketData } from './types';
import { createMarketChartOption } from './chartOptions';

interface MarketChartSectionProps {
  data: MarketData;
  chartKey: number;
}

export const MarketChartSection = ({ data, chartKey }: MarketChartSectionProps) => {
  const hasValidData = data.months.length > 0 && data.prices.length > 0 && data.days.length > 0;
  const option = createMarketChartOption(data);

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
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 max-w-md">
              There isn't enough market data available for this location and property type to display the chart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactECharts
      key={chartKey}
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={false}
    />
  );
};

