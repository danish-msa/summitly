"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BiEnvelope, BiPhone } from "react-icons/bi";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import type { AgentListItem } from "@/lib/types/agents";

interface AgentCardProps {
  agent: AgentListItem;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const socialMedia = agent.socialMedia ?? {};
  const displaySpecs = agent.specializations.slice(0, 2);
  const [imageError, setImageError] = useState(false);
  const showImage = agent.image && !imageError;

  return (
    <Link
      href={`/our-agents/${agent.slug}`}
      className="flex flex-col gap-4 group w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
      aria-label={`View ${agent.name}'s profile`}
    >
      <div className="relative overflow-hidden rounded-2xl h-[300px]">
        {showImage ? (
          <Image
            src={agent.image!}
            alt={agent.name}
            fill
            className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
            unoptimized={agent.image?.startsWith("/images/")}
          />
        ) : (
          <div className="absolute inset-0 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-2xl font-semibold">
            {agent.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
        <div className="absolute bottom-0 z-10 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2 justify-center">
            {socialMedia.facebook && (
              <a
                href={socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all"
                aria-label="Facebook"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
            )}
            {socialMedia.twitter && (
              <a
                href={socialMedia.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all"
                aria-label="Twitter"
              >
                <FaTwitter className="w-4 h-4" />
              </a>
            )}
            {socialMedia.instagram && (
              <a
                href={socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all"
                aria-label="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
            )}
            {socialMedia.linkedin && (
              <a
                href={socialMedia.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center bg-white text-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-between">
        <div>
          <h3 className="font-medium text-lg text-foreground">{agent.name}</h3>
          <span className="font-light text-muted-foreground">{agent.title}</span>
        </div>
        <div className="flex gap-2 justify-end items-center">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center text-primary border border-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all duration-500"
              aria-label="Phone"
            >
              <BiPhone className="w-4 h-4" />
            </a>
          )}
          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center text-primary border border-primary w-8 h-8 rounded-full hover:bg-primary hover:text-white transition-all duration-500"
              aria-label="Email"
            >
              <BiEnvelope className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      {displaySpecs.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <div className="flex gap-2 flex-wrap">
            {displaySpecs.map((specialty, index) => (
              <span
                key={index}
                className="bg-muted px-2 py-1 rounded-md text-foreground/80"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
