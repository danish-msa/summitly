"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaBuilding } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const DeveloperFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const [developers, setDevelopers] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Developers' }
  ]);

  // Fetch developers from API
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/developers?limit=1000');
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
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaBuilding className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getDeveloperText()}</span>
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
        <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
          <p className="font-semibold mb-3">Developer</p>
          <div className="space-y-2">
            {developers.map((developer) => {
              const isSelected = (filters.developer || 'all') === developer.value;
              
              return (
                <div 
                  key={`developer-${developer.value}`}
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer
                    transition-all hover:bg-gray-50 text-sm
                    ${isSelected 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => handleDeveloperSelect(developer.value)}
                >
                  {developer.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperFilter;

