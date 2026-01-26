import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseHomeownerPropertySlug } from '@/lib/utils/homeownerUrl';

interface HomeownerPropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: HomeownerPropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseHomeownerPropertySlug(slug);
  
  const address = parsed 
    ? `${parsed.streetNumber || ''} ${parsed.streetName || ''}, ${parsed.city || ''}, ${parsed.state || ''}`.trim()
    : 'Property';

  return {
    title: `${address} | My Home`,
    description: `View property details and insights for ${address}`,
    openGraph: {
      title: `${address} | My Home`,
      description: `View property details and insights for ${address}`,
      type: 'website',
    },
    alternates: {
      canonical: `/homeowner/${slug}`,
    },
  };
}

const HomeownerPropertyPage: React.FC<HomeownerPropertyPageProps> = async ({ params }) => {
  const { slug } = await params;
  const parsed = parseHomeownerPropertySlug(slug);

  if (!parsed) {
    notFound();
  }

  // Empty page for now - user will provide UI design later
  return (
    <div className="min-h-screen bg-white">
      <div className="container-1400 mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Property Details
          </h1>
          <p className="text-muted-foreground mb-8">
            Address: {parsed.streetNumber} {parsed.streetName}, {parsed.city}, {parsed.state} {parsed.zip}
          </p>
          
          {/* Empty page - UI will be added later */}
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Property detail page - UI coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerPropertyPage;
