import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGINATION = {
  inactiveBg: '#FFFF',
  textGray: '#5F6B7F',
} as const;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

interface PaginationItemProps {
  page: number;
  isActive: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const PaginationItem: React.FC<PaginationItemProps> = ({
  page,
  isActive,
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 w-9 min-w-[2.25rem] p-0 rounded-xl font-medium text-sm inline-flex items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'hover:opacity-90',
        isActive && 'bg-secondary text-secondary-foreground'
      )}
      style={
        isActive
          ? { boxShadow: '0 2px 8px hsl(var(--secondary) / 0.35)' }
          : {
              backgroundColor: PAGINATION.inactiveBg,
              color: PAGINATION.textGray,
            }
      }
      aria-current={isActive ? 'page' : undefined}
      aria-label={isActive ? `Page ${page}, current page` : `Go to page ${page}`}
    >
      {children ?? page}
    </button>
  );
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate the range of pages to show
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      if (currentPage > totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis');
        }
      }
      
      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <nav
      className={cn('flex items-center justify-center gap-1.5', className)}
      aria-label="Pagination"
    >
      {/* First Page (when showFirstLast) */}
      {showFirstLast && currentPage > 1 && (
        <PaginationItem
          page={1}
          isActive={false}
          onClick={() => handlePageChange(1)}
        >
          <span className="sr-only">First page</span>
          1
        </PaginationItem>
      )}

      {/* Previous */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-xl inline-flex items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          style={{ color: PAGINATION.textGray }}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-sm font-medium"
                style={{ color: PAGINATION.textGray }}
                aria-hidden
              >
                ...
              </span>
            );
          }

          return (
            <PaginationItem
              key={page}
              page={page}
              isActive={page === currentPage}
              onClick={() => handlePageChange(page)}
            />
          );
        })}
      </div>

      {/* Next */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 rounded-xl inline-flex items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          style={{ color: PAGINATION.textGray }}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      )}

      {/* Last Page (when showFirstLast) */}
      {showFirstLast && currentPage < totalPages && (
        <PaginationItem
          page={totalPages}
          isActive={false}
          onClick={() => handlePageChange(totalPages)}
        >
          <span className="sr-only">Last page</span>
          {totalPages}
        </PaginationItem>
      )}
    </nav>
  );
};

export default Pagination;
