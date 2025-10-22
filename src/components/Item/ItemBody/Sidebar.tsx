import React from 'react'
import PriceSection from './PriceSection'

const Sidebar: React.FC = () => {
  return (
    <div className='md:w-[30%] sticky h-fit md:top-[120px]'>
      <PriceSection />
    </div>
  )
}

export default Sidebar
