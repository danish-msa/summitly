"use client"
import React from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import ReviewCard from './ReviewCard'
import { userReviewData } from '@/data/data'

const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 4
    },
    desktop: {
      breakpoint: { max: 3000, min: 1324 },
      items: 4,
      slidesToslide: 1
    },
    tablet: {
      breakpoint: { max: 1324, min: 764 },
      items: 2,
      slidesToslide: 1
    },
    mobile: {
      breakpoint: { max: 764, min: 0 },
      items: 1,
      slidesToslide: 1
    }
  };

const ReviewSlider = () => {
  return (
    <Carousel responsive={responsive} arrows={true} autoPlay={true} autoPlaySpeed={3000} infinite={true}>
        {userReviewData.map((userReview) => (
            <div key={userReview.id}>
                <ReviewCard userReview={userReview} />
            </div>
        ))}
    </Carousel>
  )
}

export default ReviewSlider