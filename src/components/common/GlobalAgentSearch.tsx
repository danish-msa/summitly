"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentListItem } from "@/lib/types/agents";

const FALLBACK_AVATAR = "/images/agents/no-avatar.png";

const INPUT_CLASSES =
  "h-10 sm:h-12 rounded-full text-sm border border-slate-200 bg-white w-full pl-10 pr-10 focus:outline-none transition-[border-color,box-shadow] duration-150 focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.25)]";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchAgent(agent: AgentListItem, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const nameMatch = normalize(agent.name).includes(q);
  const titleMatch = normalize(agent.title).includes(q);
  const specMatch = agent.specializations.some((s) =>
    normalize(s).includes(q)
  );
  return nameMatch || titleMatch || specMatch;
}

export interface GlobalAgentSearchProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** When provided, called on agent select (e.g. for analytics). Still navigates to profile. */
  onAgentSelect?: (agent: AgentListItem) => void;
  /** When user presses Enter without selecting a suggestion, called with current query (e.g. navigate to find-an-agent results). */
  onSubmit?: (query: string) => void;
}

export default function GlobalAgentSearch({
  placeholder = "Search by agent name",
  className,
  inputClassName,
  onAgentSelect,
  onSubmit,
}: GlobalAgentSearchProps) {
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        const list = (data.agents ?? []) as AgentListItem[];
        if (!cancelled) setAgents(list);
      } catch (e) {
        if (!cancelled) setAgents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAgents();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return agents.slice(0, 8);
    return agents.filter((a) => matchAgent(a, query)).slice(0, 8);
  }, [agents, query]);

  const showDropdown =
    isOpen && (isFocused || query.length > 0) && (loading || suggestions.length > 0 || query.length >= 1);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAgent = (agent: AgentListItem) => {
    onAgentSelect?.(agent);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.(query);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(INPUT_CLASSES, inputClassName)}
          aria-label={placeholder}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
          <Search className="h-4 w-4" aria-hidden />
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              Loading agents…
            </div>
          )}

          {!loading && query.length >= 1 && suggestions.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              No agents found. Try a different name or specialty.
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <ul className="py-2" role="list">
              {suggestions.map((agent) => (
                <AgentSuggestionItem
                  key={agent.id}
                  agent={agent}
                  onSelect={() => handleSelectAgent(agent)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AgentSuggestionItem({
  agent,
  onSelect,
}: {
  agent: AgentListItem;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc =
    agent.image && !imageError ? agent.image : FALLBACK_AVATAR;
  const specs = agent.specializations.slice(0, 3);

  return (
    <li role="option">
      <Link
        href={`/our-agents/${agent.slug}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors text-left"
        aria-label={`View ${agent.name}, ${agent.title}`}
      >
        <span className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
            onError={() => setImageError(true)}
            unoptimized={imageSrc.startsWith("/images/")}
          />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {agent.name}
          </p>
          {agent.title && (
            <p className="text-xs text-slate-600 truncate">{agent.title}</p>
          )}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {specs.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
