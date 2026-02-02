"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Phone, Globe, Linkedin, Twitter } from "lucide-react";
import type { Agent } from "@prisma/client";
import type { AgentStats, AgentSocialLinks } from "@prisma/client";

type AgentWithBanner = Agent & {
  stats: AgentStats | null;
  social_links: AgentSocialLinks | null;
};

interface AgentProfileBannerProps {
  agent: AgentWithBanner;
}


export function AgentProfileBanner({ agent }: AgentProfileBannerProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = agent.profile_image && !imageError;
  const stats = agent.stats;
  const social = agent.social_links;

  return (
    <section className="mt-16 relative">
      {/* Two-column banner: image | details */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[40rem] relative">
        {/* Back to Directory - top left of banner */}
        <Link
          href="/our-agents"
          className="absolute top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-2 text-sm font-medium text-white bg-black/50 hover:bg-black/70 rounded-lg px-3 py-2 transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Directory
        </Link>

        {/* Left: agent photo */}
        <div className="relative min-h-[320px] md:min-h-0 bg-muted/20">
          {showImage ? (
            <Image
              src={agent.profile_image!}
              alt={agent.full_name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 45vw"
              onError={() => setImageError(true)}
              unoptimized={agent.profile_image?.startsWith("/images/")}
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl font-semibold text-white/40">
              {agent.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
        </div>

        {/* Right: dark teal panel */}
        <div className="bg-[#06262F] flex flex-col justify-center gap-4 p-6 sm:p-8 lg:px-20 lg:py-10">
          <p className="text-[#7dd3fc] text-sm font-medium uppercase tracking-wide">
            {agent.job_title}
          </p>
          <h1 className="mt-1 text-3xl sm:text-5xl font-bold text-white">
            {agent.full_name}
          </h1>
          {agent.property_specialties?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.property_specialties.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-[#7dd3fc]/60 bg-[#7dd3fc]/10 px-3 py-1 text-sm text-white"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap gap-8 sm:gap-20">
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-white">
                {stats?.years_experience != null && stats.years_experience >= 25
                  ? "25+"
                  : stats?.years_experience ?? "—"}
              </p>
              <p className="text-xs text-white/80 font-light">Years Exp.</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-white">
                {stats?.total_properties_sold ?? "—"}
              </p>
              <p className="text-xs text-white/80 font-light">Sold</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-white">
                {stats?.active_listings_count ?? "—"}
              </p>
              <p className="text-xs text-white/80 font-light">Active</p>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-6 space-y-2">
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex items-center gap-4 text-white hover:text-[#7dd3fc] transition-colors"
              >
                <span className="bg-white/10 text-white rounded-full p-3"><Mail className="h-4 w-4 shrink-0" aria-hidden /></span>
                <span>{agent.email}</span>
              </a>
            )}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center gap-4 text-white hover:text-[#7dd3fc] transition-colors"
              >
                <span className="bg-white/20 text-white rounded-full p-3"><Phone className="h-4 w-4 shrink-0" aria-hidden /></span>
                <span>{agent.phone}</span>
              </a>
            )}
            {agent.website_url && (
              <a
                href={agent.website_url.startsWith("http") ? agent.website_url : `https://${agent.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-white hover:text-[#7dd3fc] transition-colors"
              >
                <span className="bg-white/20 text-white rounded-full p-3"><Globe className="h-4 w-4 shrink-0" aria-hidden /></span>
                <span>{agent.website_url.replace(/^https?:\/\//i, "")}</span>
              </a>
            )}
          </div>

          {/* Social */}
          <div className="mt-4 flex gap-3">
            {social?.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#7dd3fc] hover:text-[#0d3d4d] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {social?.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#7dd3fc] hover:text-[#0d3d4d] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
