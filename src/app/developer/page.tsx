"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DevelopmentTeamMember {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  projectCount: number;
  url: string;
}

interface DevelopmentTeamGroup {
  type: string;
  typeLabel: string;
  typeUrl: string;
  members: DevelopmentTeamMember[];
}

interface DevelopmentTeamResponse {
  teams: DevelopmentTeamGroup[];
  total: number;
}

const AllDevelopersPage: React.FC = () => {
  const router = useRouter();
  const [developers, setDevelopers] = useState<DevelopmentTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/development-team');
        if (response.ok) {
          const data = await response.json() as DevelopmentTeamResponse;
          const developersGroup = data.teams?.find((t) => t.type === 'DEVELOPER');
          if (developersGroup) {
            setDevelopers(developersGroup.members || []);
          }
        }
      } catch (error) {
        console.error('Error fetching developers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // If only one developer, redirect to their page
  if (developers.length === 1) {
    router.push(developers[0].url);
    return null;
  }

  return (
    <div className="min-h-screen pt-10">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">All Developers</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {developers.map((developer) => (
            <Link
              key={developer.id}
              href={developer.url}
              className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{developer.name}</h3>
              {developer.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {developer.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {developer.projectCount} project{developer.projectCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllDevelopersPage;

