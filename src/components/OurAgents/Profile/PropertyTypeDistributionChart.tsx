"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

export interface PropertyTypeSlice {
  name: string;
  value: number;
  color?: string;
}

const DEFAULT_DATA: PropertyTypeSlice[] = [
  { name: "Condo townhouse", value: 48, color: "#3b82f6" },
  { name: "Detached", value: 28, color: "#ef4444" },
  { name: "Condo Apt", value: 18, color: "#22c55e" },
  { name: "Other", value: 6, color: "#f97316" },
];

export interface PropertyTypeDistributionChartProps {
  /** Chart data: name, value, optional color per slice */
  data?: PropertyTypeSlice[];
  /** Donut radius [inner, outer] as percentage strings e.g. ["38%", "72%"] */
  radius?: [string, string];
  /** Chart center [x, y] as percentage strings */
  center?: [string, string];
  /** Segment border radius (pill-like segments) */
  segmentBorderRadius?: number;
  /** Container height – Tailwind class or CSS value e.g. "h-72" or "280px" */
  height?: string;
  /** Legend: show percentages in labels */
  showLegendPercent?: boolean;
  /** Legend position: "right" | "bottom" */
  legendOrient?: "vertical" | "horizontal";
  /** Legend text color */
  legendTextColor?: string;
  /** Legend font size */
  legendFontSize?: number;
  /** Legend item gap (px) */
  legendItemGap?: number;
  /** Legend marker size [width, height] in px */
  legendItemSize?: [number, number];
  /** Extra class for the wrapper div */
  className?: string;
  /** Extra ECharts option merged on top (for advanced overrides) */
  optionOverrides?: Record<string, unknown>;
}

export function PropertyTypeDistributionChart({
  data = DEFAULT_DATA,
  radius = ["60%", "95%"],
  center = ["25%", "50%"],
  segmentBorderRadius = 10,
  height = "h-72 sm:h-44 ",
  showLegendPercent = true,
  legendOrient = "vertical",
  legendTextColor = "#334155",
  legendFontSize = 13,
  legendItemGap = 14,
  legendItemSize = [12, 12],
  className = "",
  optionOverrides = {},
}: PropertyTypeDistributionChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: d.name,
        value: d.value,
        itemStyle: d.color ? { color: d.color } : undefined,
      })),
    [data]
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item" as const,
        formatter: (params: {
          name?: string;
          value?: number;
          percent?: number;
        }) =>
          `${params.name ?? ""}: ${params.percent?.toFixed(1) ?? 0}%`,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "#e2e8f0",
        borderRadius: 8,
        textStyle: { color: "#1e293b", fontSize: 13 },
      },
      legend: {
        orient: legendOrient as "vertical" | "horizontal",
        right: legendOrient === "vertical" ? "0" : undefined,
        bottom: legendOrient === "horizontal" ? "0" : undefined,
        top: legendOrient === "vertical" ? "center" : undefined,
        left: legendOrient === "horizontal" ? "center" : undefined,
        itemWidth: legendItemSize[0],
        itemHeight: legendItemSize[1],
        itemGap: legendItemGap,
        textStyle: { color: legendTextColor, fontSize: legendFontSize },
        formatter: (name: string) => {
          const item = data.find((d) => d.name === name);
          const pct =
            item && total > 0
              ? ((item.value / total) * 100).toFixed(0)
              : "0";
          return showLegendPercent ? `${name} (${pct}%)` : name;
        },
      },
      series: [
        {
          name: "Property type",
          type: "pie" as const,
          radius,
          center,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: segmentBorderRadius,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.15)",
            },
          },
          data: chartData,
        },
      ],
      ...optionOverrides,
    }),
    [
      data,
      total,
      radius,
      center,
      segmentBorderRadius,
      showLegendPercent,
      legendOrient,
      legendTextColor,
      legendFontSize,
      legendItemGap,
      legendItemSize,
      chartData,
      optionOverrides,
    ]
  );

  const isHeightClass = height?.startsWith("h-") ?? height?.includes("min-h");
  return (
    <div
      className={[isHeightClass ? height : null, className].filter(Boolean).join(" ")}
      style={!isHeightClass && height ? { height } : undefined}
    >
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "75%" }}
        opts={{ renderer: "canvas" }}
        notMerge
        className={className}
      />
    </div>
  );
}
