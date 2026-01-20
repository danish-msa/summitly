"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapSimilarityFilterProps extends FilterComponentProps {
  similarityScore?: number; // Reference similarity score
}

export const MapSimilarityFilter: React.FC<MapSimilarityFilterProps> = ({
  filters,
  handleFilterChange,
  similarityScore
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minSimilarity, setMinSimilarity] = useState<string>('');

  const handleSimilarityChange = (value: string) => {
    setMinSimilarity(value);
    // You can implement similarity filtering logic here
  };

  return (
    <MapFilterItem
      title="Similarity"
      subjectValue={similarityScore !== undefined ? `${similarityScore}%` : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Min similarity %"
          value={minSimilarity}
          onChange={(e) => handleSimilarityChange(e.target.value)}
          min="0"
          max="100"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
        />
        <label className="text-xs text-gray-400">Minimum similarity percentage</label>
      </div>
    </MapFilterItem>
  );
};
