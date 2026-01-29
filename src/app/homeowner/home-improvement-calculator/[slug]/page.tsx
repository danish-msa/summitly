import React from "react";
import { notFound } from "next/navigation";
import {
  HomeImprovementBanner,
  HomeImprovementScenarios,
} from "@/components/Homeowner/HomeImprovementCalculator";

interface HomeImprovementCalculatorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HomeImprovementCalculatorPage({
  params,
}: HomeImprovementCalculatorPageProps) {
  const { slug } = await params;

  if (!slug?.trim()) {
    notFound();
  }

  // TODO: fetch property/home value by slug (e.g. MLS number) when API is ready
  const homeValue = 275207;

  return (
    <div className="min-h-screen bg-white">
      <HomeImprovementBanner homeValue={homeValue} />
      <HomeImprovementScenarios estimatedHomeValue={homeValue} />
    </div>
  );
}
