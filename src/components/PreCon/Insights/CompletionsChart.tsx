import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface CompletionsChartProps {
  data: { year: number; completions: number }[];
}

export function CompletionsChart({ data }: CompletionsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const option = {
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.year),
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
        data: data.map((d) => d.completions),
        type: "bar",
        barWidth: "60%",
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "hsl(142, 76%, 36%)",
              },
              {
                offset: 1,
                color: "hsl(142, 71%, 45%)",
              },
            ],
          },
          borderRadius: [8, 8, 0, 0],
        },
        label: {
          show: true,
          position: "top",
          formatter: (params: { value: number }) => {
            const value = params.value;
            if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}k`;
            }
            return value;
          },
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
      formatter: (params: Array<{ name: string; value: number }>) => {
        const param = params[0];
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
          <div style="font-size: 14px;">${param.value.toLocaleString()} units</div>
        </div>`;
      },
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
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

