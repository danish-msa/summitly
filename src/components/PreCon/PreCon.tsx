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
import { NewHomesRecommendations } from './NewHomesRecommendations/NewHomesRecommendations'
import PreConCityProperties from './PreConCityProperties/PreConCityProperties'
import PlatinumAccessVIP from './PlatinumAccessVIP/PlatinumAccessVIP'
import PreConBlogs from './Blogs/PreConBlogs'

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
      <NewHomesRecommendations />
      <PreConCityProperties />
      <PlatinumAccessVIP />
      <PreConBlogs />
      <Testimonials />
      <PreConCTA />
      <PreConFAQ />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon