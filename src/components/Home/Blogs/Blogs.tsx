import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { blogs } from '@/data/data'
import BlogCard from './BlogCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const Blogs = () => {
  // Limit to 3 posts for homepage
  const limitedBlogs = blogs.slice(0, 3);

  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading heading='From Our Blog' subheading='Latest New' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 mt-7 md:mt-10 gap-10'>
                {limitedBlogs.map((blog, i) => (
                    <div key={blog.id} data-aos="zoom-out" data-aos-delay={`${i * 50}`} data-aos-anchor-placement="top-center">
                        <BlogCard blog={blog} />
                    </div>
                ))}
            </div>
            
            {/* Show All Blogs Link */}
            <div className="flex justify-center mt-10">
                <Button 
                    variant="outline" 
                    className="group flex items-center gap-2 px-6 py-3 text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/blogs'}
                >
                    Show All Blogs
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </div>
        </div>   
    </div>
  )
}

export default Blogs