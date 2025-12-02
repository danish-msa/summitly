"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import Link from 'next/link';
import { PropertyListing } from '@/lib/types';
import { convertToPreConProperty } from '@/components/PreCon/PreConstructionBasePage/utils';

const PreConstruction: React.FC = () => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pre-construction projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch featured projects first, fallback to recent projects
        const response = await fetch('/api/pre-con-projects?limit=4&featured=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pre-construction projects');
        }

        const data = await response.json();
        let fetchedProjects = data.projects || [];

        // If we don't have enough featured projects, fetch recent ones
        if (fetchedProjects.length < 4) {
          const recentResponse = await fetch('/api/pre-con-projects?limit=4');
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            const recentProjects = recentData.projects || [];
            
            // Merge featured and recent, avoiding duplicates
            const existingMlsNumbers = new Set(fetchedProjects.map((p: PropertyListing) => p.mlsNumber));
            const additionalProjects = recentProjects.filter(
              (p: PropertyListing) => !existingMlsNumbers.has(p.mlsNumber)
            );
            
            fetchedProjects = [...fetchedProjects, ...additionalProjects].slice(0, 4);
          }
        }

        setProjects(fetchedProjects);
      } catch (err) {
        console.error('Error fetching pre-construction projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Convert PropertyListing to PreConstructionProperty format
  const preConstructionProjects = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Pre-Construction Projects"
          subheading="Coming Soon"
          description="Discover exciting pre-construction opportunities across Canada"
          position="center"
        />

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Loading projects...</div>
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-red-600">Error: {error}</div>
          </div>
        )}

        {!loading && !error && preConstructionProjects.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">No pre-construction projects available at this time.</div>
          </div>
        )}

        {!loading && !error && preConstructionProjects.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
              {preConstructionProjects.map((project) => (
                <PreConstructionPropertyCardV3
                  key={project.id}
                  property={project}
                />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/pre-construction/projects"
                className="inline-flex items-center px-6 py-3 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
              >
                View All Pre-Construction Projects
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PreConstruction;

