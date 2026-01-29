"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type RangeKey = "6m" | "1y" | "3y" | "all";

export interface ValueHistoryPoint {
  label: string; // e.g. "Jan '25"
  value: number;
}

interface ValueHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: ValueHistoryPoint[];
  currentValue: number;
  delta: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number) {
  // $429,633 -> $430k (for axis labels)
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

function slicePoints(points: ValueHistoryPoint[], range: RangeKey) {
  if (range === "all") return points;
  const take =
    range === "6m" ? 6 :
    range === "1y" ? 12 :
    36;
  return points.slice(Math.max(0, points.length - take));
}

export default function ValueHistoryModal({
  open,
  onOpenChange,
  points,
  currentValue,
  delta,
}: ValueHistoryModalProps) {
  const [range, setRange] = React.useState<RangeKey>("all");

  React.useEffect(() => {
    if (!open) setRange("all");
  }, [open]);

  const visible = React.useMemo(() => slicePoints(points, range), [points, range]);

  const chartOption = React.useMemo(() => {
    return {
      animation: true,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: { top: 18, right: 18, bottom: 26, left: 48, containLabel: false },
      xAxis: {
        type: "category",
        data: visible.map((p) => p.label),
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#6B7280",
          fontSize: 11,
          margin: 14,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#6B7280",
          fontSize: 11,
          formatter: (v: number) => formatCompact(v),
        },
        splitLine: {
          show: true,
          lineStyle: { color: "#E5E7EB" },
        },
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
          const p = Array.isArray(params) ? (params[0] as { value?: unknown; axisValue?: unknown } | undefined) : undefined;
          const raw = p?.value;
          const value =
            typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) || 0 : 0;
          const label = typeof p?.axisValue === "string" ? p.axisValue : "";
          return `
            <div style="font-weight:700; margin-bottom:4px;">${label}</div>
            <div style="font-weight:700;">${formatCurrency(value)}</div>
          `;
        },
        axisPointer: {
          type: "line",
          lineStyle: { color: "#4F46E5", width: 2, opacity: 0.25 },
        },
      },
      series: [
        {
          name: "Estimated value",
          type: "line",
          data: visible.map((p) => p.value),
          smooth: 0.6,
          showSymbol: false,
          lineStyle: { width: 3, color: "#4F46E5" },
        },
      ],
    };
  }, [visible]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] max-h-[90vh] p-0 overflow-hidden bg-white flex flex-col [&>button[class*='absolute']]:hidden">
        <div className="flex items-start justify-between gap-4 p-6 border-b">
          <div>
            <div className="text-4xl font-extrabold text-gray-900">
              {formatCurrency(currentValue)}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Up <span className="font-semibold text-gray-900">{formatCurrency(delta)}</span>{" "}
              ({((delta / Math.max(currentValue - delta, 1)) * 100).toFixed(4)}%) since{" "}
              {points.length ? points[Math.max(0, points.length - 12)]?.label : ""}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-500 hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="text-sm font-semibold text-gray-800">
              Estimated property valuation over time
            </div>

            <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1">
              {([
                { key: "6m", label: "6M" },
                { key: "1y", label: "1Y" },
                { key: "3y", label: "3Y" },
                { key: "all", label: "All" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setRange(t.key)}
                  className={[
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    range === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <ReactECharts
            option={chartOption}
            style={{ height: 300, width: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge={true}
            lazyUpdate={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

