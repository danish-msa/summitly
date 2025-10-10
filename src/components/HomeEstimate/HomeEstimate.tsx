import React from 'react'
import Hero from './Hero/Hero'
import StepsSellingHome from './StepsSellingHome/StepsSellingHome'
import WhySellWithUs from './WhySellWithUs/WhySellWithUs'
const HomeEstimate: React.FC = () => {
  return (
    <div>
      <Hero />
      <StepsSellingHome />
      <WhySellWithUs />
    </div>
  )
}

export default HomeEstimate