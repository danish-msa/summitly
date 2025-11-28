import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building2, 
  Building, 
  Warehouse, 
  MapPin,
  Hotel,
  Factory,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyType {
  value: string;
  label: string;
  icon: React.ElementType;
  subtypes?: Array<{ value: string; label: string }>;
}

const PROPERTY_TYPES: PropertyType[] = [
  { value: 'all', label: 'All Types', icon: LayoutGrid },
  { 
    value: 'Condos', 
    label: 'Condos', 
    icon: Building2,
    subtypes: [
      { value: 'Low-Rise', label: 'Low-Rise' },
      { value: 'Mid-Rise', label: 'Mid-Rise' },
      { value: 'High-Rise', label: 'High-Rise' },
    ]
  },
  { 
    value: 'Houses', 
    label: 'Houses', 
    icon: Home,
    subtypes: [
      { value: 'Link', label: 'Link' },
      { value: 'Townhouse', label: 'Townhouse' },
      { value: 'Semi-Detached', label: 'Semi-Detached' },
      { value: 'Detached', label: 'Detached' },
    ]
  },
  { value: 'Lofts', label: 'Lofts', icon: Warehouse },
  { value: 'Master-Planned Communities', label: 'Master-Planned', icon: MapPin },
  { value: 'Multi Family', label: 'Multi Family', icon: Hotel },
  { value: 'Offices', label: 'Offices', icon: Factory },
];

interface PropertyTypeSelectorProps {
  value: string;
  subValue?: string;
  onChange: (value: string) => void;
  onSubChange?: (value: string) => void;
}

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  value,
  subValue,
  onChange,
  onSubChange,
}) => {
  const [expandedType, setExpandedType] = useState<string | null>(
    value === 'Condos' || value === 'Houses' ? value : null
  );

  // Sync expandedType when value changes externally (e.g., reset)
  useEffect(() => {
    if (value === 'Condos' || value === 'Houses') {
      setExpandedType(value);
    } else {
      setExpandedType(null);
    }
  }, [value]);

  const handleTypeSelect = (type: PropertyType) => {
    onChange(type.value);
    
    if (type.subtypes && type.subtypes.length > 0) {
      setExpandedType(type.value);
      // Keep current subValue if it's valid for this type, otherwise reset to 'all'
      if (type.value === 'all' || !subValue || !type.subtypes.find(st => st.value === subValue)) {
        onSubChange?.('all');
      }
    } else {
      setExpandedType(null);
      onSubChange?.('all');
    }
  };

  const selectedType = PROPERTY_TYPES.find(t => t.value === value);
  const hasSubtypes = selectedType?.subtypes && selectedType.subtypes.length > 0;

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">Property Type</label>
      
      {/* Property Type Grid */}
      <div className="grid grid-cols-4 gap-2">
        {PROPERTY_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = value === type.value;
          const hasSubMenu = type.subtypes && type.subtypes.length > 0;
          
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleTypeSelect(type)}
              className={cn(
                "property-card relative",
                isActive ? "property-card-active" : "property-card-inactive"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 mb-1.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {type.label}
              </span>
              {hasSubMenu && (
                <ChevronDown className={cn(
                  "absolute bottom-1 right-1 h-3 w-3 transition-transform",
                  isActive && expandedType === type.value ? "rotate-180 text-primary" : "text-muted-foreground"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Subtypes Section */}
      {hasSubtypes && expandedType === value && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2 duration-200">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            {selectedType?.label} Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSubChange?.('all')}
              className={cn(
                "filter-pill h-8 px-3 text-xs font-medium rounded-lg",
                (!subValue || subValue === 'all') ? "filter-pill-active" : "filter-pill-inactive"
              )}
            >
              All
            </button>
            {selectedType?.subtypes?.map((subtype) => (
              <button
                key={subtype.value}
                type="button"
                onClick={() => onSubChange?.(subtype.value)}
                className={cn(
                  "filter-pill h-8 px-3 text-xs font-medium rounded-lg",
                  subValue === subtype.value ? "filter-pill-active" : "filter-pill-inactive"
                )}
              >
                {subtype.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyTypeSelector;

