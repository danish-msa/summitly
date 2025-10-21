"use client";

import { useState, useEffect } from "react";
import BlogHeader from "@/components/Blog/BlogHeader";
import RecentPosts from "@/components/Blog/RecentPosts";
import AllPosts from "@/components/Blog/AllPosts";
import SimplePagination from "@/components/Blog/SimplePagination";
import { getPaginatedBlogPosts, getBlogTags, getBlogAuthors } from "@/data/data";
import { BlogFilters } from "@/data/types";

const BlogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BlogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [postsPerPage] = useState(6);

  const paginatedData = getPaginatedBlogPosts(filters, currentPage, postsPerPage);
  const availableTags = getBlogTags();
  const availableAuthors = getBlogAuthors();

  useEffect(() => {
    const newFilters: BlogFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedTag) newFilters.tag = selectedTag;
    if (selectedAuthor) newFilters.author = selectedAuthor;
    
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedTag, selectedAuthor]);

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
    setSelectedTag("");
    setSelectedAuthor("");
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
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Authors</option>
                {availableAuthors.map(author => (
                  <option key={author} value={author}>{author}</option>
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
