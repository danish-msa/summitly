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
    <div className='relative rounded-2xl overflow-hidden bg-white p-6 m-3 shadow'>
        <FaQuoteRight className='absolute w-8 h-8 top-3 right-3 text-primary'/>
        <div className='mt-6 mb-3 flex items-center'>
            <FaStar className='w-4 h-4 text-yellow-600'/>
            <FaStar className='w-4 h-4 text-yellow-600'/>
            <FaStar className='w-4 h-4 text-yellow-600'/>
            <FaStar className='w-4 h-4 text-yellow-600'/>
            <FaStar className='w-4 h-4 text-yellow-600'/>
        </div>
        <p className='text-gray-600 text-[2] font-light'>{userReview.review}</p>
        <div className='h-[1.2px] mt-6 mb-6 bg-gray-500 opacity-15'></div>
        <div className='flex items-center'>
            <Image src={userReview.userImage} alt={userReview.name} width={40} height={40} className='rounded-full'/>
            <div className='ml-4'>
                <h4 className='text-sm font-semibold text-gray-600'>{userReview.name}</h4>
                <p className='text-sm text-gray-500'>{userReview.profession}</p>
            </div>
        </div>
    </div>
  )
}

export default ReviewCard