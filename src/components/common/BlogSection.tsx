import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { getBlogPosts } from '@/data/data'
import BlogCard from '@/components/Home/Blogs/BlogCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { BlogFilters } from '@/data/types'

interface BlogSectionProps {
  /**
   * Category to filter blogs by (e.g., 'Pre-construction', 'Design', etc.)
   * If not provided, shows all blogs
   */
  category?: string;
  
  /**
   * Main heading for the section
   */
  heading: string;
  
  /**
   * Subheading for the section
   */
  subheading?: string;
  
  /**
   * Description text below the heading
   */
  description?: string;
  
  /**
   * Maximum number of blogs to display (default: 3)
   */
  limit?: number;
  
  /**
   * URL for "View All" button (default: '/blogs' with category query param if category is provided)
   */
  viewAllLink?: string;
  
  /**
   * Additional filters for blog posts (search, tag, author, featured, etc.)
   */
  filters?: BlogFilters;
  
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Show "View All" button (default: true)
   */
  showViewAll?: boolean;
}

const BlogSection: React.FC<BlogSectionProps> = ({
  category,
  heading,
  subheading,
  description,
  limit = 3,
  viewAllLink,
  filters = {},
  className = '',
  showViewAll = true,
}) => {
  // Combine category with other filters
  const blogFilters: BlogFilters = {
    ...filters,
    ...(category && { category }),
  };

  // Get filtered blogs
  const filteredBlogs = getBlogPosts(blogFilters);
  
  // Limit to specified number
  const limitedBlogs = filteredBlogs.slice(0, limit);

  // Generate view all link if not provided
  const defaultViewAllLink = category 
    ? `/blogs?category=${encodeURIComponent(category)}`
    : '/blogs';

  const finalViewAllLink = viewAllLink || defaultViewAllLink;

  // Don't render if no blogs found
  if (limitedBlogs.length === 0) {
    return null;
  }

  return (
    <div className={`pt-16 pb-16 bg-background ${className}`}>
      <div className='container-1400 mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading={heading}
          subheading={subheading || ''}
          description={description || ''}
        />
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 mt-7 md:mt-10 gap-10'>
          {limitedBlogs.map((blog, i) => (
            <div 
              key={blog.id} 
              data-aos="zoom-out" 
              data-aos-delay={`${i * 50}`} 
              data-aos-anchor-placement="top-center"
            >
              <Link href={`/blogs${category ? `?category=${encodeURIComponent(category)}` : ''}`}>
                <BlogCard blog={blog} />
              </Link>
            </div>
          ))}
        </div>
        
        {/* Show All Blogs Link */}
        {showViewAll && limitedBlogs.length > 0 && (
          <div className="flex justify-center mt-10">
            <Link href={finalViewAllLink}>
              <Button 
                variant="outline" 
                className="group flex items-center gap-2 px-6 py-3 text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300"
              >
                View All {category ? `${category} ` : ''}Blogs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        )}
      </div>   
    </div>
  )
}

export default BlogSection

