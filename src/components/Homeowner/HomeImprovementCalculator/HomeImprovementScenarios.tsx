"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Info, ChevronRight, Home, Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  HOME_IMPROVEMENT_SCENARIOS,
  type HomeImprovementScenario,
} from "./scenarioData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getScenarioAddedValue(
  scenario: HomeImprovementScenario,
  sqFt: number | undefined
): number {
  if (scenario.hasSqFt && scenario.valuePerSqFt != null) {
    const effectiveSqFt = sqFt ?? scenario.defaultSqFt ?? 0;
    return Math.round(effectiveSqFt * scenario.valuePerSqFt);
  }
  return scenario.estimatedAddedValue;
}

interface HomeImprovementScenariosProps {
  /** Current/estimated home value; used for base row and total in the card */
  estimatedHomeValue?: number;
}

export default function HomeImprovementScenarios({
  estimatedHomeValue = 0,
}: HomeImprovementScenariosProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sqFtByScenario, setSqFtByScenario] = useState<Record<string, number>>({});

  const totalAddedValue = useMemo(() => {
    return HOME_IMPROVEMENT_SCENARIOS.reduce((sum, s) => {
      if (!selectedIds.has(s.id)) return sum;
      const sqFt = sqFtByScenario[s.id];
      return sum + getScenarioAddedValue(s, sqFt);
    }, 0);
  }, [selectedIds, sqFtByScenario]);

  const selectedScenariosWithValues = useMemo(() => {
    return HOME_IMPROVEMENT_SCENARIOS.filter((s) => selectedIds.has(s.id)).map(
      (scenario) => ({
        scenario,
        addedValue: getScenarioAddedValue(scenario, sqFtByScenario[scenario.id]),
      })
    );
  }, [selectedIds, sqFtByScenario]);

  const totalEstimatedValue = estimatedHomeValue + totalAddedValue;

  const toggleScenario = useCallback(
    (scenario: HomeImprovementScenario) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(scenario.id)) {
          next.delete(scenario.id);
          return next;
        }
        next.add(scenario.id);
        return next;
      });
      setSqFtByScenario((sq) => {
        if (selectedIds.has(scenario.id)) {
          const copy = { ...sq };
          delete copy[scenario.id];
          return copy;
        }
        if (scenario.hasSqFt && (scenario.defaultSqFt != null || scenario.defaultSqFt === 0)) {
          return { ...sq, [scenario.id]: scenario.defaultSqFt };
        }
        return sq;
      });
    },
    [selectedIds]
  );

  const setSqFt = useCallback((id: string, value: number) => {
    const clamped = Math.max(0, Math.min(9999, Math.round(value)));
    setSqFtByScenario((prev) => ({ ...prev, [id]: clamped }));
  }, []);

  return (
    <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left column - ~2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Home improvement scenarios
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Updates and remodels can add value to a home, especially in older
              homes that may have outdated features.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-100 border border-gray-200">
            <Info className="h-5 w-5 shrink-0 text-gray-500 mt-0.5" aria-hidden />
            <p className="text-sm text-gray-600">
              Cost and value added are based on where you live.
            </p>
          </div>

          <div className="space-y-3">
            {HOME_IMPROVEMENT_SCENARIOS.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                selected={selectedIds.has(scenario.id)}
                sqFt={sqFtByScenario[scenario.id]}
                onToggle={() => toggleScenario(scenario)}
                onSqFtChange={(v) => setSqFt(scenario.id, v)}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-8">
            Cost data is based on actual project costs as reported by Summitly
            members. This value is an estimation by Summitly and not a reflection
            of real costs or home value added.
          </p>
        </div>

        {/* Right column - ~1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Estimated added value card - breakdown + total + CTA */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-white overflow-hidden price-card-gradient shadow-xl"
          >
            <h3 className="text-lg font-semibold text-center mb-6">
              Estimated added value
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/90">
                  Summitly estimated value
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(estimatedHomeValue)}
                </span>
              </div>

              {selectedScenariosWithValues.map(({ scenario, addedValue }) => (
                <div key={scenario.id} className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                    Project
                  </span>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/95">
                      {scenario.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      + {formatCurrency(addedValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-5 border-white/30" aria-hidden />

            <p className="text-2xl sm:text-3xl font-bold text-center mb-6 tabular-nums">
              {formatCurrency(totalEstimatedValue)}
            </p>

            <div className="text-center space-y-1">
              <p className="text-sm text-white/70">I can help you...</p>
              <Link
                href="/contact"
                className="block text-base font-bold text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
              >
                Finance your next home purchase.
              </Link>
            </div>
          </div>

          {/* Ready to renovate banner */}
          <div
            className="rounded-2xl overflow-hidden text-white relative min-h-[200px] flex flex-col justify-end p-6 sm:p-8 price-card-gradient shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, hsl(194 85% 51%) 0%, hsl(160 60% 45%) 100%)",
            }}
          >
            <div className="absolute bottom-4 right-4 opacity-20">
              <Home className="h-32 w-32" aria-hidden />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide mb-2">
                Ready to renovate?
              </h3>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-white font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
              >
                Let&apos;s finance your vision
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  selected,
  sqFt,
  onToggle,
  onSqFtChange,
}: {
  scenario: HomeImprovementScenario;
  selected: boolean;
  sqFt: number | undefined;
  onToggle: () => void;
  onSqFtChange: (value: number) => void;
}) {
  const effectiveSqFt =
    scenario.hasSqFt && sqFt != null ? sqFt : scenario.defaultSqFt ?? 10;
  const addedValue = getScenarioAddedValue(scenario, sqFt);

  return (
    <div
      className={`
        flex flex-col p-4 rounded-xl border transition-colors
        ${selected ? "border-[#1AC0EB] bg-sky-50/40" : "border-gray-200 bg-white hover:bg-gray-50"}
      `}
    >
      <label className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 cursor-pointer">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select ${scenario.label}`}
            className="shrink-0"
          />
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Project
            </span>
            <p className="font-medium text-gray-900">{scenario.label}</p>
          </div>
        </div>
        <div className="sm:text-right pl-8 sm:pl-0 sm:w-28 shrink-0">
          <p className="text-xs text-gray-500 mb-0.5">Est. added value</p>
          <p className="text-sm font-semibold text-gray-900">
            {addedValue > 0 ? `+ ${formatCurrency(addedValue)}` : "0"}
          </p>
        </div>
      </label>

      {selected && (
        <div className="mt-4 pl-8 sm:pl-11 space-y-4 border-t border-gray-200/80 pt-4">
          {scenario.description && (
            <p className="text-sm text-gray-600">{scenario.description}</p>
          )}

          {scenario.hasSqFt && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 border-gray-300"
                onClick={() => onSqFtChange(effectiveSqFt - 1)}
                aria-label="Decrease square footage"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <input
                type="number"
                min={0}
                max={9999}
                value={effectiveSqFt}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) onSqFtChange(v);
                }}
                className="h-10 w-20 rounded-lg border border-gray-200 px-3 text-center text-sm font-medium text-gray-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Square footage"
              />
              <span className="text-sm text-gray-600 shrink-0">sq.ft.</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 border-gray-300"
                onClick={() => onSqFtChange(effectiveSqFt + 1)}
                aria-label="Increase square footage"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}

          <p className="text-sm text-gray-500">
            HomeAdvisor estimated cost {scenario.costRange}
          </p>
        </div>
      )}
    </div>
  );
}
