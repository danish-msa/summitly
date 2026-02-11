import React, { useState } from 'react';
import Pagination from '@/components/ui/pagination';

// Example usage of the Pagination component
const PaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 25; // Example: 25 total pages

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    console.log('Page changed to:', page);
    // Here you would typically fetch new data for the selected page
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Pagination Examples</h2>
        
        {/* Basic Pagination */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Pagination</h3>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Minimal Pagination (no first/last) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Minimal Pagination</h3>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showFirstLast={false}
          />
        </div>

        {/* Compact Pagination */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Compact Pagination</h3>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showFirstLast={false}
            showPrevNext={false}
            maxVisiblePages={3}
          />
        </div>

        {/* Current Page Info */}
        <div className="text-sm text-muted-foreground">
          Current Page: {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export default PaginationExample;
