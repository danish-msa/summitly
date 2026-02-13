"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Globe, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";
import type { Agent } from "@prisma/client";
import type { AgentStats, AgentSocialLinks } from "@prisma/client";
import { Button } from "@/components/ui/button";

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
      {/* Banner container */}
      <div className="bg-primary h-[240px]"></div>
      {/* Two-column banner: image | details */}
      <div className="grid grid-cols-1 md:grid-cols-2 relative top-[-200px] -mb-[200px] max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-xl">
        {/* Back to Directory - top left of banner */}
        <Link
          href="/our-agents"
          className="absolute top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-2 text-sm font-medium text-white bg-black/50 hover:bg-black/70 rounded-lg px-3 py-2 transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Directory
        </Link>

        {/* Left: agent photo */}
        <div className="relative md:min-h-0 h-[35rem] bg-muted/20">
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
        <div className="bg-white flex flex-col justify-center gap-4 p-6 sm:p-8 lg:px-20 lg:py-10 text-primary">
          <h1 className="mt-1 text-3xl sm:text-5xl font-bold text-black">
            {agent.full_name}
          </h1>
          <p className="text-secondary text-sm font-medium uppercase tracking-wide">
            {agent.job_title}
          </p>
          {agent.property_specialties?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.property_specialties.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-secondary/60 bg-secondary/10 px-3 py-1 text-sm text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {agent.languages_spoken?.length > 0 && (
            <div className="mt-3">
              <h2 className="text-sm font-semibold text-primary mb-2">
                Languages Spoken
              </h2>
              <div className="flex flex-wrap gap-2">
                {agent.languages_spoken.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social media – below Languages Spoken */}
          {(social?.linkedin || social?.twitter || social?.facebook || social?.instagram || social?.youtube) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {social?.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-primary hover:bg-secondary hover:text-primary-foreground transition-colors"
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
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-primary hover:bg-secondary hover:text-primary-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-primary hover:bg-secondary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-primary hover:bg-secondary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {social?.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-primary hover:bg-secondary hover:text-primary-foreground transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Stats row */}
          {/* <div className="flex flex-wrap gap-8 sm:gap-20">
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-primary">
                {stats?.years_experience != null && stats.years_experience >= 25
                  ? "25+"
                  : stats?.years_experience ?? "—"}
              </p>
              <p className="text-xs text-primary/80 font-light">Years Exp.</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-primary">
                {stats?.total_properties_sold ?? "—"}
              </p>
              <p className="text-xs text-primary/80 font-light">Sold</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-primary">
                {stats?.active_listings_count ?? "—"}
              </p>
              <p className="text-xs text-primary/80 font-light">Active</p>
            </div>
          </div> */}

          {/* Contact + Visit Website */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-secondary/90 transition-colors"
            >
              <a href="#contact">
                Contact Agent
              </a>
            </Button>
            {agent.website_url && (
              <Button
                asChild
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary bg-transparent px-6 py-3 text-sm font-medium text-primary transition-colors"
              >
                <a href={agent.website_url.startsWith("http") ? agent.website_url : `https://${agent.website_url}`} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
