"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MapFilterItemProps {
  title: string;
  subjectValue?: string | number; // Reference value (e.g., "4" for bedrooms, "Single Family Detached" for property type)
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const MapFilterItem: React.FC<MapFilterItemProps> = ({
  title,
  subjectValue,
  isExpanded,
  onToggle,
  onClose,
  children
}) => {
  if (!isExpanded) {
    return (
      <div
        onClick={onToggle}
        className="py-2 px-0 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors text-sm"
      >
        {title}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close filter"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subject Reference */}
      {subjectValue !== undefined && (
        <div className="text-xs text-gray-500 mb-3">
          Subject / {subjectValue}
        </div>
      )}

      {/* Filter Content */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};
