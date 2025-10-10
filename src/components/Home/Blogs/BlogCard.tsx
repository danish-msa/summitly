import React from 'react'
import { BiCalendar } from 'react-icons/bi';
import BlurImage from '../../Helper/BlurImage';

type Props = {
    blog: {
        id: number;
        date: string;
        comment: string;
        title: string;
        shortDescription: string;
        image: string;
    }
}

const BlogCard = ({ blog }: Props) => {
  return (
    <div className='overflow-hidden rounded-lg cursor-pointer'>
                <div className='relative w-full h-60'>
                    <BlurImage src={blog.image} alt={blog.title} layout='fill' objectFit='cover' className='w-full object-cover ration rounded-xl' />
                    <div className='absolute top-4 left-4 bg-primary text-white text-sm z-10 flex items-center space-x-2 rounded-full px-2 py-1.5'>
                        <BiCalendar />
                        <p>{blog.date}</p>
                    </div>
                </div>
                <div className='py-4'>
                    <div className='flex items-center space-x-2'>
                        <p className='text-sm font-semibold text-gray-700'>Real Estate</p>
                    </div>
                    
                    <h3 className='pt-2 pb-2 text-xl font-medium text-black hover:text-primary'>{blog.title}</h3>
                    <p className='text-sm text-gray-700'>{blog.shortDescription}</p>
                </div>
            </div>
  )
}

export default BlogCard