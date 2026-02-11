import { AmenityCategory } from './types';

interface CategoryTabsProps {
  categories: AmenityCategory[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const CategoryTabs = ({ categories, activeTab, onTabChange }: CategoryTabsProps) => {
  return (
    <div className="mb-4 sm:mb-6 flex w-full justify-start overflow-x-auto overflow-y-hidden border-b border-gray-200 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 [touch-action:pan-x]" style={{ WebkitOverflowScrolling: 'touch' }}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onTabChange(category.id)}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
            activeTab === category.id
              ? "border-b-2 border-primary text-primary bg-secondary/10 rounded-tl-lg rounded-tr-lg"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

