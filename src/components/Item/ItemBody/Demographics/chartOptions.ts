import { ChartDataItem } from './types';

/**
 * Create pie chart option for echarts
 */
export const createPieChartOption = (data: ChartDataItem[], title: string) => {
  return {
    tooltip: {
      trigger: "item" as const,
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    legend: {
      orient: "vertical" as const,
      left: "left",
      textStyle: {
        color: "#1f2937",
      },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        return item ? `${name} (${item.value}${title.includes('Type') ? '%' : ''})` : name;
      },
    },
    grid: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    series: [
      {
        name: title,
        type: "pie" as const,
        radius: ["40%", "70%"],
        center: ['60%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside" as const,
          formatter: "{d}%",
          color: "#1f2937",
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: "bold" as const,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: `hsl(${(index * 360) / data.length}, 70%, 60%)`,
          },
        })),
      },
    ],
  };
};

