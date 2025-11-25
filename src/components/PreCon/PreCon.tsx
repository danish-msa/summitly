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
import PreConBlogs from './Blogs/PreConBlogs'
import NotifyMe from './NotifyMe/NotifyMe'
import PreConSection from './PreConSection'

const PreCon: React.FC = () => {
  // Get current year for "Closing This Year" filter
  const currentYear = new Date().getFullYear().toString();

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
      
      {/* Platinum Access - High Rise */}
      <PreConSection
        heading="Platinum Access - High Rise"
        subheading="Platinum Access VIP"
        description="Exclusive VIP access to prestigious high-rise pre-construction condominium projects with premium amenities and luxury living"
        filter={{ type: 'high-rise-condos' }}
        viewAllLink="/pre-construction/high-rise-condos"
        limit={10}
      />

      {/* Platinum Access - Low Rise */}
      <PreConSection
        heading="Platinum Access - Low Rise"
        subheading="Platinum Access VIP"
        description="Exclusive VIP access to prestigious low-rise pre-construction condominium projects with premium amenities and luxury living"
        filter={{ type: 'low-rise-condos' }}
        viewAllLink="/pre-construction/low-rise-condos"
        limit={10}
      />

      {/* Closing This Year */}
      <PreConSection
        heading="Closing This Year"
        subheading="Completing Soon"
        description={`Discover pre-construction projects completing in ${currentYear}. Explore upcoming developments ready for occupancy this year.`}
        filter={{ type: 'closing-this-year', year: currentYear }}
        viewAllLink={`/pre-construction/${currentYear}`}
        limit={10}
      />

      {/* Recently Added */}
      <PreConSection
        heading="Recently Added"
        subheading="New Projects"
        description="Explore the latest pre-construction projects added to our platform. Discover new developments and opportunities."
        filter={{ type: 'recently-added' }}
        viewAllLink="/pre-construction/projects"
        limit={10}
      />

      <NotifyMe />
      <PreConBlogs />
      <Testimonials />
      <PreConCTA />
      <PreConFAQ />
      <ConnectWithUs />
    </div>
  )
}

export default PreCon