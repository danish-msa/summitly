"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaBuilding } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const DeveloperFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [developers, setDevelopers] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Developers' }
  ]);

  // Fetch developers from API
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/development-team?limit=1000');
        if (response.ok) {
          const data = await response.json();
          const developerList = [
            { value: 'all', label: 'All Developers' },
            ...(data.developers || []).map((dev: { id: string; name: string }) => ({
              value: dev.id,
              label: dev.name
            }))
          ];
          setDevelopers(developerList);
        }
      } catch (error) {
        console.error('Error fetching developers:', error);
      }
    };

    fetchDevelopers();
  }, []);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Handle developer selection
  const handleDeveloperSelect = (value: string) => {
    const event = {
      target: {
        name: 'developer',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for developer
  const getDeveloperText = () => {
    const developerValue = filters.developer || 'all';
    const selectedDeveloper = developers.find(d => d.value === developerValue);
    return selectedDeveloper ? selectedDeveloper.label : 'All Developers';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'developer',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaBuilding className="text-secondary" />
        <span>{getDeveloperText()}</span>
        {filters.developer && filters.developer !== 'all' && filters.developer !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear developer filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {developers.map((developer) => {
            const isSelected = (filters.developer || 'all') === developer.value;
            return (
              <button
                key={developer.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleDeveloperSelect(developer.value)}
              >
                {developer.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeveloperFilter;

