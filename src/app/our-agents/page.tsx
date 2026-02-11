import React from "react";
import { Metadata } from "next";
import OurAgentsClient from "@/components/OurAgents/OurAgentsClient";

export const metadata: Metadata = {
  title: "Our Agents | Meet Our Elite Agents",
  description:
    "Exceptional properties require exceptional representation. Find the perfect partner for your real estate journey.",
  openGraph: {
    title: "Our Agents | Meet Our Elite Agents",
    description:
      "Exceptional properties require exceptional representation. Find the perfect partner for your real estate journey.",
    type: "website",
  },
  alternates: {
    canonical: "/our-agents",
  },
};

export default function OurAgentsPage() {
  return <OurAgentsClient />;
}
