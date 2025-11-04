import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AmenityCategory } from './types';

interface FiltersSectionProps {
  category: AmenityCategory;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FiltersSection = ({ category, activeFilter, onFilterChange }: FiltersSectionProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium">Filters:</span>
      <Select value={activeFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          <SelectItem value="High Rated">High Rated</SelectItem>
          <SelectItem value="Nearby">Nearby</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2">
        {category.filters.map((filter) => (
          <Badge
            key={filter.label}
            variant={activeFilter === filter.label ? "default" : "outline"}
            className="cursor-pointer px-4 py-1.5"
            onClick={() => onFilterChange(filter.label)}
          >
            {filter.label} ({filter.count})
          </Badge>
        ))}
      </div>
    </div>
  );
};

