import { AmenityCategory } from './types';

interface CategoryTabsProps {
  categories: AmenityCategory[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const CategoryTabs = ({ categories, activeTab, onTabChange }: CategoryTabsProps) => {
  return (
    <div className="mb-6 flex w-full justify-start overflow-x-auto border-b border-gray-200">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onTabChange(category.id)}
          className={`whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === category.id
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

