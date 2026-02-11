"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import ReactECharts from "echarts-for-react";

import { Button } from "@/components/ui/button";
import ValueHistoryModal, { type ValueHistoryPoint } from "./ValueHistoryModal";

interface ValueChangeCardProps {
  delta?: number;
  currentValue?: number;
  forecastLabel?: string; // e.g. "Jan. 2027"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ValueChangeCard({
  delta = 2394,
  currentValue = 228396,
  forecastLabel = "Jan. 2027",
}: ValueChangeCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const seriesData = React.useMemo(() => {
    // Simple sparkline-like series derived from current value + delta (placeholder until real history arrives)
    const start = currentValue - Math.max(delta * 2, 1500);
    return [
      start,
      start + delta * 0.25,
      start + delta * 0.15,
      start + delta * 0.55,
      start + delta * 0.35,
      currentValue,
      currentValue + delta,
    ].map((v) => Math.max(0, Math.round(v)));
  }, [currentValue, delta]);

  const xLabels = React.useMemo(() => ["", "", "", "", "", "", ""], []);

  const chartOption = React.useMemo(() => {
    return {
      animation: true,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: { top: 8, right: 8, bottom: 0, left: 8, containLabel: false },
      xAxis: {
        type: "category",
        data: xLabels,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        borderRadius: 12,
        padding: [10, 12],
        textStyle: { color: "#111827", fontSize: 12 },
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? (params[0] as { value?: unknown } | undefined) : undefined;
          const raw = p?.value;
          const value =
            typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) || 0 : 0;
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(value);
          return `<div style="font-weight:700;">${formatted}</div>`;
        },
        axisPointer: {
          type: "line",
          lineStyle: { color: "#0EA5E9", width: 2, opacity: 0.35 },
        },
      },
      series: [
        {
          type: "line",
          data: seriesData,
          smooth: 0.6,
          showSymbol: false,
          lineStyle: { width: 3, color: "#0EA5E9" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(14,165,233,0.25)" },
                { offset: 1, color: "rgba(14,165,233,0)" },
              ],
            },
          },
          emphasis: {
            focus: "series",
            itemStyle: { color: "#111827", borderColor: "#fff", borderWidth: 3 },
          },
        },
      ],
    };
  }, [seriesData, xLabels]);

  const historyPoints = React.useMemo<ValueHistoryPoint[]>(() => {
    // Placeholder historical data until we have real series from backend.
    // Creates ~10 years of monthly points with a couple of bumps so the full-history chart feels realistic.
    const months = 10 * 12;
    const startValue = Math.max(50_000, Math.round(currentValue * 0.48));
    const endValue = currentValue;
    const slope = (endValue - startValue) / (months - 1);

    const points: ValueHistoryPoint[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));

    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      const label = d.toLocaleString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(-2);

      // deterministic wiggle + two "market events"
      const wiggle = Math.sin(i / 3.2) * 850 + Math.cos(i / 7.1) * 450;
      const event1 = i > 70 && i < 86 ? (i - 70) * 2600 : 0;
      const event2 = i > 86 && i < 98 ? (98 - i) * 2100 : 0;

      const value = Math.max(0, Math.round(startValue + slope * i + wiggle + event1 + event2));
      points.push({ label, value });
    }

    // Ensure last point equals currentValue
    points[points.length - 1] = { ...points[points.length - 1], value: currentValue };
    return points;
  }, [currentValue]);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Image header */}
      <div className="relative h-32">
        <Image
          src="/images/house-buying.jpeg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 360px"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 p-5 flex items-start">
          <h3 className="text-white text-xl font-semibold leading-snug">
            Your property value is
            <br />
            changing
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="text-4xl font-extrabold text-emerald-600">
          +{formatCurrency(delta)}
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <div className="font-medium text-gray-900">{formatCurrency(currentValue)}</div>
          <div className="text-gray-500">-</div>
          <div className="font-medium text-gray-900">{forecastLabel}</div>
          <div className="text-gray-500">Forecast one year</div>
        </div>

        {/* Mini chart */}
        <div className="mt-4">
          <ReactECharts
            option={chartOption}
            style={{ height: 70, width: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge={true}
            lazyUpdate={false}
          />
        </div>

        <Button
          type="button"
          className="mt-4 w-full rounded-xl py-6 text-base font-semibold"
          onClick={() => setIsHistoryOpen(true)}
        >
          View full history
          <ArrowUpRight className="h-5 w-5 ml-2" aria-hidden="true" />
        </Button>
      </div>

      <ValueHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        points={historyPoints}
        currentValue={currentValue}
        delta={delta}
      />
    </div>
  );
}

