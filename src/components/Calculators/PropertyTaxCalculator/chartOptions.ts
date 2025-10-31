import * as echarts from 'echarts';
import { formatCurrency } from './utils';

export const getPieChartOption = (data: Array<{name: string, value: number, color?: string}>, title: string) => {
  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
      textStyle: {
        color: "#1f2937",
      },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        return item ? `${name} (${item.value}%)` : name;
      },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
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
            fontSize: 16,
            fontWeight: "bold",
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
            color: item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`,
          },
        })),
      },
    ],
  };
};

export const getHorizontalBarChartOption = (
  data: Array<{name: string, amount: number, percentageOfCityTax: number, color?: string}>,
  title: string
) => {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const paramsArray = Array.isArray(params) ? params : [params];
        const firstParam = paramsArray[0];
        if (!firstParam || typeof firstParam !== 'object') {
          return '';
        }
        // For bar chart tooltips with axis trigger, params contain data about the series
        const item = firstParam as {
          value?: number;
          name?: string;
          data?: { percentage?: string; value?: number };
        };
        const value = item.value || (item.data?.value) || 0;
        const percentage = item.data?.percentage || '0';
        const name = item.name || '';
        return `${name}: ${formatCurrency(value)} (${percentage}%)`;
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      textStyle: {
        color: "#1f2937",
      },
    },
    grid: {
      left: "15%",
      right: "10%",
      top: "10%",
      bottom: "10%",
      containLabel: true
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => formatCurrency(value)
      },
      axisLine: {
        lineStyle: {
          color: "#e5e7eb"
        }
      },
      splitLine: {
        lineStyle: {
          color: "#f3f4f6"
        }
      }
    },
    yAxis: {
      type: "category",
      data: data.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: "#e5e7eb"
        }
      },
      axisLabel: {
        color: "#1f2937",
        fontSize: 12
      }
    },
    series: [
      {
        name: title,
        type: "bar",
        data: data.map((item, index) => ({
          value: item.amount,
          name: item.name,
          percentage: item.percentageOfCityTax.toFixed(1),
          itemStyle: {
            color: item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`,
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: "60%",
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          }
        }
      }
    ]
  };
};

