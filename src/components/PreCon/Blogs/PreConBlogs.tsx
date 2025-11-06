import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { getBlogPosts } from '@/data/data'
import BlogCard from '@/components/Home/Blogs/BlogCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PreConBlogs = () => {
  // Filter blogs by Pre-construction category
  const preConBlogs = getBlogPosts({ category: 'Pre-construction' });
  
  // Limit to 3 posts for the section
  const limitedBlogs = preConBlogs.slice(0, 3);

  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading 
              heading='Pre-Construction Insights' 
              subheading='Latest News' 
              description='Stay informed with the latest news, tips, and insights about pre-construction properties in Canada' 
            />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 mt-7 md:mt-10 gap-10'>
                {limitedBlogs.map((blog, i) => (
                    <div key={blog.id} data-aos="zoom-out" data-aos-delay={`${i * 50}`} data-aos-anchor-placement="top-center">
                        <BlogCard blog={blog} />
                    </div>
                ))}
            </div>
            
            {/* Show All Pre-Construction Blogs Link */}
            <div className="flex justify-center mt-10">
                <Link href="/blogs?category=Pre-construction">
                    <Button 
                        variant="outline" 
                        className="group flex items-center gap-2 px-6 py-3 text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300"
                    >
                        View All Pre-Construction Blogs
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                </Link>
            </div>
        </div>   
    </div>
  )
}

export default PreConBlogs

