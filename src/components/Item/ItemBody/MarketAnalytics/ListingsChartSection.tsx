import ReactECharts from "echarts-for-react";
import { ListingsData } from './types';
import { createListingsChartOption } from './chartOptions';

interface ListingsChartSectionProps {
  data: ListingsData;
  chartKey: number;
}

export const ListingsChartSection = ({ data, chartKey }: ListingsChartSectionProps) => {
  const hasValidData = data.months.length > 0 && data.newListings.length > 0 && data.closedListings.length > 0;
  const option = createListingsChartOption(data);

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
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 max-w-md">
              There isn't enough listings activity data available for this location and property type to display the chart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactECharts
      key={`listings-${chartKey}`}
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={false}
    />
  );
};

