"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_VALUE = "__all__";

export { ALL_VALUE };

interface OurAgentsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  languageValue: string;
  onLanguageChange: (value: string) => void;
  specializationValue: string;
  onSpecializationChange: (value: string) => void;
  languageOptions: string[];
  specializationOptions: string[];
  onClear: () => void;
  className?: string;
}

export default function OurAgentsFilterBar({
  searchValue,
  onSearchChange,
  languageValue,
  onLanguageChange,
  specializationValue,
  onSpecializationChange,
  languageOptions,
  specializationOptions,
  onClear,
  className,
}: OurAgentsFilterBarProps) {
  const hasFilters =
    searchValue.trim() !== "" ||
    (languageValue !== "" && languageValue !== ALL_VALUE) ||
    (specializationValue !== "" && specializationValue !== ALL_VALUE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 min-w-0 sm:flex-[2]">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search by agent name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-[2.75rem] min-h-[2.75rem] py-2 rounded-lg border border-border bg-background pr-4"
              style={{ paddingLeft: "2.5rem" }}
              aria-label="Search agents by name"
            />
          </div>
        </div>

        <Select value={languageValue || ALL_VALUE} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-[2.75rem] min-h-[2.75rem] py-0 rounded-lg border border-border">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Languages</SelectItem>
            {languageOptions.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={specializationValue || ALL_VALUE} onValueChange={onSpecializationChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-[2.75rem] min-h-[2.75rem] py-0 rounded-lg border border-border">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Specializations</SelectItem>
            {specializationOptions.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={!hasFilters}
          className="shrink-0 h-[2.75rem] w-[2.75rem] rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
        </Button>
      </div>
    </div>
  );
}
