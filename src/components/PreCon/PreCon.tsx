import React from 'react'
import Hero from './Hero/Hero'
import ConnectWithUs from '../Home/ConnectWithUs/ConnectWithUs'
import AsSeenOn from '../Home/AsSeenOn/AsSeenOn'
import PreConstructionProjects from './PreConstructionProjects/PreConstructionProjects'
import PreConCTA from './PreConCTA/PreConCTA'

const PreCon: React.FC = () => {
  return (
    <div className='overflow-hidden'>
      <Hero />
      <AsSeenOn />
      <PreConstructionProjects />
      <PreConCTA />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon