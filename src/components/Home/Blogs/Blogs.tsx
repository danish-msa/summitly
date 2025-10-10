import React from 'react'
import SectionHeading from '@/components/Helper/SectionHeading'
import { blogs } from '@/data/data'
import BlogCard from './BlogCard'

const Blogs = () => {
  return (
    <div className='pt-16 pb-16 bg-background'>
        <div className='w-[85%] mx-auto'>
            <SectionHeading heading='From Our Blog' subheading='Latest New' description='' />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 mt-7 md:mt-10 gap-10'>
                {blogs.map((blog, i) => (
                    <div key={blog.id} data-aos="zoom-out" data-aos-delay={`${i * 150}`} data-aos-anchor-placement="top-center">
                        <BlogCard blog={blog} />
                    </div>
                ))}
            </div>
        </div>   
    </div>
  )
}

export default Blogs