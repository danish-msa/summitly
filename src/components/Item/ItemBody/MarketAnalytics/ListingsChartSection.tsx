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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading listings data...</p>
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

