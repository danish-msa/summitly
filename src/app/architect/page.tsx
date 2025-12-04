"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AllArchitectsPage: React.FC = () => {
  const router = useRouter();
  const [architects, setArchitects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchitects = async () => {
      try {
        const response = await fetch('/api/development-team');
        if (response.ok) {
          const data = await response.json();
          const architectsGroup = data.teams?.find((t: any) => t.type === 'ARCHITECT');
          if (architectsGroup) {
            setArchitects(architectsGroup.members || []);
          }
        }
      } catch (error) {
        console.error('Error fetching architects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchitects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // If only one architect, redirect to their page
  if (architects.length === 1) {
    router.push(architects[0].url);
    return null;
  }

  return (
    <div className="min-h-screen pt-10">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">All Architects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {architects.map((architect) => (
            <Link
              key={architect.id}
              href={architect.url}
              className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{architect.name}</h3>
              {architect.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {architect.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {architect.projectCount} project{architect.projectCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllArchitectsPage;

