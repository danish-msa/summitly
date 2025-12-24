import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Area {
  id: string;
  name: string;
  value: number;
}

interface AreaSelectorProps {
  areas: Area[];
  selectedArea: string;
  onAreaChange: (areaId: string) => void;
}

export function AreaSelector({ areas, selectedArea, onAreaChange }: AreaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAreaData = areas.find((area) => area.id === selectedArea);

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium">{selectedAreaData?.name}</span>
          <ChevronDown className="ml-0 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-[300px] p-0 bg-card border-border" 
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-background border-border"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredAreas.map((area) => (
            <button
              key={area.id}
              onClick={() => {
                onAreaChange(area.id);
                setOpen(false);
                setSearchQuery("");
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors",
                selectedArea === area.id && "bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                {selectedArea === area.id && (
                  <Check className="h-4 w-4 text-success" />
                )}
                <span className={cn(
                  "font-medium",
                  selectedArea === area.id ? "text-foreground" : "text-foreground/80"
                )}>
                  {area.name}
                </span>
              </div>
              <span className="text-muted-foreground">{area.value.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

