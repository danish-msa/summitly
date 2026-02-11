import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  children 
}) => {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-9 w-9 p-0 rounded-lg",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children || page}
    </Button>
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
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Pagination"
    >
      {/* First Page */}
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

      {/* Previous Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-3"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">More pages</span>
              </div>
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

      {/* Next Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 px-3"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      )}

      {/* Last Page */}
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
