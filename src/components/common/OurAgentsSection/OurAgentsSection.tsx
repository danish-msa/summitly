"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/Helper/SectionHeading";
import AgentCard from "@/components/OurAgents/AgentCard";
import type { AgentListItem } from "@/lib/types/agents";

export interface OurAgentsSectionProps {
  /** Main heading */
  heading?: string;
  /** Small label above heading */
  subheading?: string;
  /** Description below heading */
  description?: string;
  /** Max number of agents to show (default: 8) */
  limit?: number;
  /** Show the "Find Your Perfect Match" CTA block (default: true) */
  showAgentFinderCta?: boolean;
  /** CTA link (default: /find-an-agent) */
  agentFinderHref?: string;
  /** Container class */
  className?: string;
  /** Inner max width (default: max-w-[1300px]) */
  maxWidth?: string;
}

const DEFAULT_HEADING = "Meet Our Agents";
const DEFAULT_SUBHEADING = "Our Team";
const DEFAULT_DESCRIPTION =
  "Our experienced agents are here to help you find your dream property.";

export function OurAgentsSection({
  heading = DEFAULT_HEADING,
  subheading = DEFAULT_SUBHEADING,
  description = DEFAULT_DESCRIPTION,
  limit = 8,
  showAgentFinderCta = true,
  agentFinderHref = "/find-an-agent",
  className = "",
  maxWidth = "max-w-[1300px]",
}: OurAgentsSectionProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        const list = (data.agents ?? []) as AgentListItem[];
        setAgents(list);
      } catch {
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const displayAgents = agents.slice(0, limit);

  return (
    <section
      className={`pt-16 pb-16 bg-white ${className}`}
      aria-labelledby="our-agents-section-heading"
    >
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <SectionHeading
          heading={heading}
          subheading={subheading}
          description={description}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-10 md:mt-16">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[380px] rounded-2xl bg-muted animate-pulse"
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-10 md:mt-16">
            {displayAgents.map((agent, i) => (
              <div
                key={agent.id}
                data-aos="zoom-in"
                data-aos-delay={i * 30}
                data-aos-anchor-placement="top-center"
                className="flex flex-col items-center"
              >
                <AgentCard agent={agent} />
              </div>
            ))}
          </div>
        )}

        {showAgentFinderCta && (
          <div className="mt-24 bg-secondary rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-primary text-base bg-white px-6 py-1 rounded-full">
                Agent Finder
              </span>
              <h2 className="text-white text-3xl md:text-4xl my-4">
                Find Your Perfect Match
              </h2>
              <p className="text-white text-lg">
                Answer a few questions to find the real estate agent who&apos;s
                right for your needs.
              </p>
            </div>
            <Link
              href={agentFinderHref}
              className="inline-block px-8 py-3 bg-primary hover:bg-white text-white hover:text-primary rounded-lg transition-all whitespace-nowrap"
            >
              Find an Agent
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default OurAgentsSection;
