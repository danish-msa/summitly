"use client"
import React from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import ReviewCard from './ReviewCard'
import { userReviewData } from '@/data/data'

const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 3
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      slidesToSlide: 1
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 2,
      slidesToSlide: 1
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
      slidesToSlide: 1
    }
  };

const ReviewSlider = () => {
  return (
    <div className="relative">
      <Carousel 
        responsive={responsive} 
        arrows={true} 
        autoPlay={true} 
        autoPlaySpeed={4000} 
        infinite={true}
        showDots={false}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
        containerClass="carousel-container"
        customLeftArrow={<CustomLeftArrow />}
        customRightArrow={<CustomRightArrow />}
      >
        {userReviewData.map((userReview) => (
            <div key={userReview.id} className="p-2">
                <ReviewCard userReview={userReview} />
            </div>
        ))}
      </Carousel>
    </div>
  )
}

// Custom Arrow Components
const CustomLeftArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-mist hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
  >
    <svg className="w-5 h-5 text-midnight group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

const CustomRightArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-mist hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
  >
    <svg className="w-5 h-5 text-midnight group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

export default ReviewSlider