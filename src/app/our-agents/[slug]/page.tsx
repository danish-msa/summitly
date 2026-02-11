import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AgentProfileBanner, AgentProfileContent } from "@/components/OurAgents/Profile";

interface AgentProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: AgentProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = await prisma.agent.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { full_name: true, job_title: true, about_agent: true, slug: true },
  });
  if (!agent) return { title: "Agent Not Found | Our Agents" };
  const name = agent.full_name;
  const description =
    agent.about_agent?.slice(0, 160) ||
    `${agent.job_title} at Summitly. View ${name}'s profile and contact information.`;
  return {
    title: `${name} | Our Agents`,
    description,
    alternates: { canonical: `/our-agents/${agent.slug}` },
  };
}

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { slug } = await params;

  const agent = await prisma.agent.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      stats: true,
      social_links: true,
      service_areas: true,
      featured_listings: true,
      reviews: true,
    },
  });

  if (!agent) notFound();

  return (
    <div className="min-h-screen bg-background">
      <AgentProfileBanner agent={agent} />
      <AgentProfileContent agent={agent} />
    </div>
  );
}
