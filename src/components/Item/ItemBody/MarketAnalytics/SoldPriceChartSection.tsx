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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading sold price data...</p>
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

