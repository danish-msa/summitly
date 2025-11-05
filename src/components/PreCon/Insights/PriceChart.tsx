import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface PriceChartProps {
  data: { year: number; price: number }[];
}

export function PriceChart({ data }: PriceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const option = {
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.year),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      axisLabel: {
        color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
        fontSize: 12,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
      },
    },
    series: [
      {
        data: data.map((d) => d.price),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          color: "hsl(221, 83%, 53%)",
          width: 3,
        },
        itemStyle: {
          color: "hsl(221, 83%, 53%)",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(59, 130, 246, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(59, 130, 246, 0.05)",
              },
            ],
          },
        },
        label: {
          show: true,
          position: "top",
          formatter: "${c}",
          color: isDark ? "#fff" : "#000",
          fontSize: 11,
          fontWeight: 600,
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)",
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      textStyle: {
        color: isDark ? "#fff" : "#000",
      },
      formatter: (params: any) => {
        const param = params[0];
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
          <div style="font-size: 14px;">$${param.value.toLocaleString()}/ft</div>
        </div>`;
      },
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "300px", width: "100%" }}
      opts={{ renderer: "svg" }}
    />
  );
}

