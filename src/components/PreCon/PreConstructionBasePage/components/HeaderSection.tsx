import React from 'react';
import { Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PageType } from '../types';

interface HeaderSectionProps {
  title: string;
  customContent?: string | null;
  lastUpdatedDate: string;
  pageType: PageType;
  displayCount: string;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  customContent,
  lastUpdatedDate,
  pageType,
  displayCount,
}) => {
  const buildHeading = () => {
    if (pageType === 'by-location') {
      return (
        <>
          {displayCount} Pre Construction Homes in <span className='text-secondary'>{title}</span>
        </>
      );
    } else {
      return (
        <>
          <span className='text-secondary'>{displayCount}</span> {title}
        </>
      );
    }
  };

  return (
    <header className="border-b bg-card pt-10">
      <div className="container-1400 mx-auto py-6">
        <div className="flex flex-col justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {buildHeading()}
            </h1>
            <div className="space-y-3">
              {customContent && (
                <div 
                  className="text-muted-foreground text-base leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: customContent }}
                />
              )}
              <p className="text-sm text-muted-foreground/80">
                Last Updated: {lastUpdatedDate}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-end lg:items-end gap-3">
            <p className="text-sm text-muted-foreground text-center lg:text-right">
              Be the first to hear about new properties
            </p>
            <button 
              onClick={() => {
                toast({
                  title: "Alerts Coming Soon",
                  description: "Property alerts for pre-construction projects will be available soon.",
                  variant: "default",
                });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm font-medium whitespace-nowrap"
            >
              <Bell className="w-5 h-5" />
              <span>Alert Me of New Properties</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

