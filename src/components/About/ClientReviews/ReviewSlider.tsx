"use client"
import React, { memo } from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import ReviewCard from './ReviewCard'
import { userReviewData } from '@/data/data'

import { ResponsiveType } from 'react-multi-carousel';

const responsive: ResponsiveType = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 3000 },
    items: 4
  },
  desktop: {
    breakpoint: { max: 3000, min: 1324 },
    items: 4,
    slidesToSlide: 1
  },
  tablet: {
    breakpoint: { max: 1324, min: 764 },
    items: 2,
    slidesToSlide: 1
  },
  mobile: {
    breakpoint: { max: 764, min: 0 },
    items: 1,
    slidesToSlide: 1
  }
};

const ReviewSlider: React.FC = memo(() => {
  return (
    <Carousel 
      responsive={responsive}
      arrows={true} 
      autoPlay={true} 
      autoPlaySpeed={3000} 
      infinite={true}
      removeArrowOnDeviceType={["tablet", "mobile"]}
      keyBoardControl={true}
      customTransition="transform 300ms ease-in-out"
      transitionDuration={300}
    >
      {userReviewData.map((userReview) => (
        <div key={userReview.id} className="px-2">
          <ReviewCard userReview={userReview} />
        </div>
      ))}
    </Carousel>
  )
})

ReviewSlider.displayName = 'ReviewSlider';

export default ReviewSlider