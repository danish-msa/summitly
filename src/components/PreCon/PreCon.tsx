import React from 'react'
import Hero from './Hero/Hero'
import ConnectWithUs from '../Home/ConnectWithUs/ConnectWithUs'
import AsSeenOn from '../Home/AsSeenOn/AsSeenOn'
import FeaturedProjects from './FeaturedProjects/FeaturedProjects'
import PreConstructionProjects from './PreConstructionProjects/PreConstructionProjects'
import PreConCTA from './PreConCTA/PreConCTA'
import PreConCallToAction from './CallToAction/CallToAction'
import PreConFAQ from './FAQ/FAQ'
import PreConstructionJourney from './PreConstructionJourney/PreConstructionJourney'
import { InsightsSection } from './Insights/InsightsSection'
import { Testimonials } from './Testimonials/Testimonials'
// import CardComparison from './CardComparison/CardComparison'

const PreCon: React.FC = () => {
  return (
    <div className='overflow-hidden'>
      <Hero />
      <AsSeenOn />
      <FeaturedProjects />
      <PreConCallToAction />
      <PreConstructionJourney />
      <InsightsSection />
      <PreConstructionProjects />
      {/* <CardComparison /> */}
      
      <Testimonials />
      <PreConCTA />
      <PreConFAQ />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon