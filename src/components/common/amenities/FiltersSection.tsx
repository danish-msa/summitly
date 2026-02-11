"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AmenityCategory } from './types';

interface FiltersSectionProps {
  category: AmenityCategory;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FiltersSection = ({ category, activeFilter, onFilterChange }: FiltersSectionProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeFilterData = category.filters.find((filter) => filter.label === activeFilter);

  const filteredOptions = category.filters.filter((filter) =>
    filter.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
      <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">Filter:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full min-w-0 sm:w-[250px] justify-between rounded-lg bg-background hover:bg-muted/50 transition-colors text-sm sm:text-base"
          >
            <span className="font-medium truncate">
              {activeFilterData ? `${activeFilterData.label} (${activeFilterData.count})` : "Select filter..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(300px,calc(100vw-2rem))] p-0 bg-card border-border" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background border-border rounded-lg"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No filters found
              </div>
            ) : (
              filteredOptions.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => {
                    onFilterChange(filter.label);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors",
                    activeFilter === filter.label && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {activeFilter === filter.label && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span className={cn(
                      "font-medium",
                      activeFilter === filter.label ? "text-foreground" : "text-foreground/80"
                    )}>
                      {filter.label}
                    </span>
                  </div>
                  <span className="text-muted-foreground">{filter.count}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

