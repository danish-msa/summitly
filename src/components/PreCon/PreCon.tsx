import React from 'react'
import Hero from './Hero/Hero'
import FeaturedIn from '../Home/FeaturedIn/FeaturedIn'
import WhatWeDo from './WhatWeDo/WhatWeDo'
import ConnectWithUs from '../Home/ConnectWithUs/ConnectWithUs'

const PreCon: React.FC = () => {
  return (
    <div className='overflow-hidden bg-white'>
      <Hero />
      <FeaturedIn />
      <WhatWeDo />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon