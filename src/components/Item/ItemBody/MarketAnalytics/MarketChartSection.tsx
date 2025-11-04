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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading chart data...</p>
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

