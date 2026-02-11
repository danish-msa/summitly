"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_VALUE = "__all__";
const TYPE_ALL = "__all__";
const VERIFIED_ALL = "__all__";
const VERIFIED_ONLY = "verified";
const VERIFIED_NOT = "not_verified";

export { ALL_VALUE, TYPE_ALL, VERIFIED_ALL, VERIFIED_ONLY, VERIFIED_NOT };

interface OurAgentsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  languageValue: string;
  onLanguageChange: (value: string) => void;
  specializationValue: string;
  onSpecializationChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  verifiedValue: string;
  onVerifiedChange: (value: string) => void;
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
  typeValue,
  onTypeChange,
  verifiedValue,
  onVerifiedChange,
  languageOptions,
  specializationOptions,
  onClear,
  className,
}: OurAgentsFilterBarProps) {
  const hasFilters =
    searchValue.trim() !== "" ||
    (languageValue !== "" && languageValue !== ALL_VALUE) ||
    (specializationValue !== "" && specializationValue !== ALL_VALUE) ||
    (typeValue !== "" && typeValue !== TYPE_ALL) ||
    (verifiedValue !== "" && verifiedValue !== VERIFIED_ALL);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search agents by name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 rounded-lg border-border bg-background pr-4"
            style={{ paddingLeft: "2.5rem" }}
            aria-label="Search agents by name"
          />
        </div>

        <Select value={languageValue || ALL_VALUE} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-lg border-border">
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
          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-lg border-border">
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

        <Select value={typeValue || TYPE_ALL} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-lg border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TYPE_ALL}>All Types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>

        <Select value={verifiedValue || VERIFIED_ALL} onValueChange={onVerifiedChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-lg border-border">
            <SelectValue placeholder="Verified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VERIFIED_ALL}>All Agents</SelectItem>
            <SelectItem value={VERIFIED_ONLY}>Verified only</SelectItem>
            <SelectItem value={VERIFIED_NOT}>Not verified</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={!hasFilters}
          className="shrink-0 h-11 w-11 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
