import ReactECharts from "echarts-for-react";
import { ChartDataItem } from './types';
import { createPieChartOption } from './chartOptions';

interface PieChartProps {
  data: ChartDataItem[];
  title: string;
}

export const PieChart = ({ data, title }: PieChartProps) => {
  const option = createPieChartOption(data, title);

  return (
    <div className="h-[500px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};

