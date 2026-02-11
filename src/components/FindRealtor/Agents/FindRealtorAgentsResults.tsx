"use client";

import React, { useEffect, useState, useMemo } from "react";
import OurAgentsBanner from "@/components/OurAgents/OurAgentsBanner";
import OurAgentsFilterBar, {
  ALL_VALUE,
  TYPE_ALL,
  VERIFIED_ALL,
  VERIFIED_ONLY,
  VERIFIED_NOT,
} from "@/components/OurAgents/OurAgentsFilterBar";
import AgentCard from "@/components/OurAgents/AgentCard";
import type { AgentListItem } from "@/lib/types/agents";
import type { FindRealtorAgentsParams } from "./types";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function filterAgents(
  agents: AgentListItem[],
  search: string,
  language: string,
  specialization: string,
  type: string,
  verified: string
): AgentListItem[] {
  return agents.filter((a) => {
    const searchNorm = normalize(search);
    if (searchNorm) {
      const nameMatch = normalize(a.name).includes(searchNorm);
      const titleMatch = normalize(a.title).includes(searchNorm);
      const specMatch = a.specializations.some((s) =>
        normalize(s).includes(searchNorm)
      );
      if (!nameMatch && !titleMatch && !specMatch) return false;
    }
    if (language && !a.languages.some((l) => normalize(l) === normalize(language)))
      return false;
    if (
      specialization &&
      !a.specializations.some(
        (s) => normalize(s) === normalize(specialization)
      )
    )
      return false;
    if (type && type !== TYPE_ALL && a.agent_type !== type) return false;
    if (verified && verified !== VERIFIED_ALL) {
      if (verified === VERIFIED_ONLY && !a.verified_agent) return false;
      if (verified === VERIFIED_NOT && a.verified_agent) return false;
    }
    return true;
  });
}

/** Derive initial search string from URL search segment (agentname-xxx or zipcode). */
function getInitialSearchFromSegment(segment: string): string {
  if (!segment || segment === "all") return "";
  if (segment.startsWith("agentname-")) {
    return segment.replace("agentname-", "").replace(/-/g, " ");
  }
  return segment;
}

/** Map URL agenttype segment to filter value (e.g. agenttype-all -> ""). */
function getInitialTypeFromSegment(segment: string): string {
  if (!segment || segment === "agenttype-all") return "";
  const v = segment.replace("agenttype-", "").toUpperCase();
  if (v === "RESIDENTIAL" || v === "COMMERCIAL" || v === "BOTH") return v;
  return "";
}

interface FindRealtorAgentsResultsProps extends FindRealtorAgentsParams {}

export default function FindRealtorAgentsResults({
  search: searchSegment,
  intent,
  sort,
  agenttype,
  page,
}: FindRealtorAgentsResultsProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() =>
    getInitialSearchFromSegment(searchSegment)
  );
  const [language, setLanguage] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [type, setType] = useState(() =>
    getInitialTypeFromSegment(agenttype)
  );
  const [verified, setVerified] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        const list = (data.agents ?? []) as AgentListItem[];
        setAgents(list);
      } catch (e) {
        console.error("Failed to fetch agents:", e);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) =>
      a.languages.forEach((l) => l?.trim() && set.add(l.trim()))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [agents]);

  const specializationOptions = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) =>
      a.specializations.forEach((s) => s?.trim() && set.add(s.trim()))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [agents]);

  const filteredAgents = useMemo(
    () =>
      filterAgents(
        agents,
        search,
        language,
        specialization,
        type,
        verified
      ),
    [agents, search, language, specialization, type, verified]
  );

  const clearFilters = () => {
    setSearch("");
    setLanguage("");
    setSpecialization("");
    setType("");
    setVerified("");
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value === ALL_VALUE ? "" : value);
  };
  const handleSpecializationChange = (value: string) => {
    setSpecialization(value === ALL_VALUE ? "" : value);
  };
  const handleTypeChange = (value: string) => {
    setType(value === TYPE_ALL ? "" : value);
  };
  const handleVerifiedChange = (value: string) => {
    setVerified(value === VERIFIED_ALL ? "" : value);
  };

  return (
    <div className="min-h-screen bg-background">
      <OurAgentsBanner />

      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <OurAgentsFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          languageValue={language || ALL_VALUE}
          onLanguageChange={handleLanguageChange}
          specializationValue={specialization || ALL_VALUE}
          onSpecializationChange={handleSpecializationChange}
          typeValue={type || TYPE_ALL}
          onTypeChange={handleTypeChange}
          verifiedValue={verified || VERIFIED_ALL}
          onVerifiedChange={handleVerifiedChange}
          languageOptions={languageOptions}
          specializationOptions={specializationOptions}
          onClear={clearFilters}
        />

        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-lg font-medium">
              {agents.length === 0
                ? "No agents found."
                : "No agents match your filters."}
            </p>
            {agents.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-primary hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
