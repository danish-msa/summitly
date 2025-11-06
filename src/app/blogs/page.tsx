"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BlogHeader from "@/components/Blog/BlogHeader";
import RecentPosts from "@/components/Blog/RecentPosts";
import AllPosts from "@/components/Blog/AllPosts";
import SimplePagination from "@/components/Blog/SimplePagination";
import { getPaginatedBlogPosts, getBlogCategories } from "@/data/data";
import { BlogFilters } from "@/data/types";

const BlogsPage = () => {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BlogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [postsPerPage] = useState(6);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const paginatedData = getPaginatedBlogPosts(filters, currentPage, postsPerPage);
  const availableCategories = getBlogCategories();

  useEffect(() => {
    const newFilters: BlogFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedCategory) newFilters.category = selectedCategory;
    
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // No automatic scroll - let users stay where they are
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      
      {/* Search and Filter Section */}
      <section className="max-w-[1400px] mx-auto px-4 py-8 md:px-8">
        <div className="">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>

      <RecentPosts />
      
      <AllPosts 
        currentPage={currentPage}
        postsPerPage={postsPerPage}
        filters={filters}
      />
      
      {paginatedData.totalPages > 1 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={paginatedData.totalPages}
          onPageChange={handlePageChange}
          hasNextPage={paginatedData.hasNextPage}
          hasPrevPage={paginatedData.hasPrevPage}
        />
      )}
    </div>
  );
};

export default BlogsPage;
