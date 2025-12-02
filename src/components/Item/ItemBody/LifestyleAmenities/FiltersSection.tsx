import { Badge } from "@/components/ui/badge";
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

