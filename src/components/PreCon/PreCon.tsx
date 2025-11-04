import React from 'react'
import Hero from './Hero/Hero'
import WhatWeDo from './WhatWeDo/WhatWeDo'
import ConnectWithUs from '../Home/ConnectWithUs/ConnectWithUs'
import AsSeenOn from '../Home/AsSeenOn/AsSeenOn'

const PreCon: React.FC = () => {
  return (
    <div className='overflow-hidden'>
      <Hero />
      <AsSeenOn />
      <WhatWeDo />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon