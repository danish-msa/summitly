import Image from 'next/image'
import React from 'react'
import { FaQuoteRight, FaStar } from 'react-icons/fa';

type Props = {
    userReview: {
        id: number;
        name: string;
        profession: string;
        userImage: string;
        review: string;
    }
}

const ReviewCard = ({userReview}: Props) => {
  return (
    <div className='relative rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm p-8 m-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group'>
        {/* Quote Icon */}
        <div className='absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-300'>
            <FaQuoteRight className='w-5 h-5 text-primary'/>
        </div>
        
        {/* Stars */}
        <div className='flex items-center mb-6'>
            {[...Array(5)].map((_, i) => (
                <FaStar key={i} className='w-4 h-4 text-amber-400 mr-1'/>
            ))}
        </div>
        
        {/* Review Text */}
        <blockquote className='text-midnight text-base leading-relaxed mb-6 font-body relative z-10'>
            "{userReview.review}"
        </blockquote>
        
        {/* Divider */}
        <div className='h-px bg-brand-celestial/20 mb-6'></div>
        
        {/* User Info */}
        <div className='flex items-center'>
            <div className='relative'>
                <Image 
                    src={userReview.userImage} 
                    alt={userReview.name} 
                    width={48} 
                    height={48} 
                    className='rounded-full border-2 border-white shadow-sm'
                />
                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white'></div>
            </div>
            <div className='ml-4'>
                <h4 className='text-sm font-semibold text-midnight font-heading'>{userReview.name}</h4>
                <p className='text-sm text-smoky-gray font-body'>{userReview.profession}</p>
            </div>
        </div>
    </div>
  )
}

export default ReviewCard