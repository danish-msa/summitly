import { ChevronDown } from "lucide-react";
import { AmenityCategory } from './types';
import { FiltersSection } from './FiltersSection';
import { AmenityCard } from './AmenityCard';

interface CategoryContentProps {
  category: AmenityCategory;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export const CategoryContent = ({
  category,
  activeFilter,
  onFilterChange,
  showAll,
  onToggleShowAll,
}: CategoryContentProps) => {
  const displayItems = showAll ? category.items : category.items.slice(0, 5);

  return (
    <div className="space-y-6">
      <FiltersSection
        category={category}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      <div className="space-y-4">
        {displayItems.map((item) => (
          <AmenityCard key={item.id} amenity={item} categoryId={category.id} />
        ))}
      </div>

      {category.items.length > 5 && (
        <button
          onClick={onToggleShowAll}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {showAll ? "Show less" : `Show all ${category.label}`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showAll ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
};

