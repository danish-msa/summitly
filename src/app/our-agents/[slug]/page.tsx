import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { toDirectS3UrlIfNeeded } from "@/lib/s3";
import { DEFAULT_ABOUT_AGENT } from "@/lib/constants/agents";
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
  const aboutText = (agent.about_agent?.trim() || DEFAULT_ABOUT_AGENT).slice(0, 160);
  const description =
    aboutText ||
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

  const agentWithDirectImageUrls = {
    ...agent,
    profile_image: toDirectS3UrlIfNeeded(agent.profile_image) ?? agent.profile_image,
    cover_image: toDirectS3UrlIfNeeded(agent.cover_image) ?? agent.cover_image,
  };

  return (
    <div className="min-h-screen bg-background">
      <AgentProfileBanner agent={agentWithDirectImageUrls} />
      <AgentProfileContent agent={agentWithDirectImageUrls} />
    </div>
  );
}
