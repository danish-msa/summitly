import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { PropertyListing } from '@/lib/types';

interface BreadcrumbsProps {
  property: PropertyListing;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ property }) => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Pre-Construction', href: '/pre-con' },
    ...(property.address.city ? [{ label: property.address.city, href: null }] : []),
    ...(property.address.neighborhood ? [{ label: property.address.neighborhood, href: null }] : []),
    { 
      label: property.preCon?.projectName || property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''}`.trim() || 'Property', 
      href: null 
    }
  ];

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index === 0 && (
              <Link 
                href={item.href || '#'} 
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            )}
            {index > 0 && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {item.href ? (
                  <Link 
                    href={item.href} 
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

