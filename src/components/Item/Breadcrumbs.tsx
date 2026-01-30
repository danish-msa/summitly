import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { PropertyListing } from '@/lib/types';

interface BreadcrumbsProps {
  property: PropertyListing;
  isPreCon?: boolean;
  isRent?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ property, isPreCon = false, isRent = false }) => {
  const getBreadcrumbLabel = () => {
    if (isPreCon) return 'Pre-Construction';
    if (isRent) return 'Rent';
    return 'Listings';
  };

  const getBreadcrumbHref = () => {
    if (isPreCon) return '/pre-con';
    if (isRent) return '/rent';
    return '/listings';
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: getBreadcrumbLabel(), href: getBreadcrumbHref() },
    ...(property.address.city ? [{ label: property.address.city, href: null }] : []),
    ...(property.address.neighborhood ? [{ label: property.address.neighborhood, href: null }] : []),
    { label: property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''}`.trim() || 'Property', href: null }
  ];

  return (
    <nav
      className="overflow-x-auto overflow-y-hidden -mx-1 px-1 mb-3 sm:mb-4 scrollbar-hide [touch-action:pan-x]"
      style={{ WebkitOverflowScrolling: 'touch' }}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-nowrap w-max min-w-full text-xs sm:text-sm text-gray-600">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {index === 0 && (
              <Link 
                href={item.href || '#'} 
                className="flex items-center gap-0.5 sm:gap-1 hover:text-primary transition-colors flex-shrink-0"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                <span className="sr-only">Home</span>
              </Link>
            )}
            {index > 0 && (
              <>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" aria-hidden />
                {item.href ? (
                  <Link 
                    href={item.href} 
                    className="hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium whitespace-nowrap">{item.label}</span>
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

