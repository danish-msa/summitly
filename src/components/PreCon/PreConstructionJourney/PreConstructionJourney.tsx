import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Search, TrendingUp } from 'lucide-react'
import SectionHeading from '@/components/Helper/SectionHeading'

const PreConstructionJourney = () => {
  return (
    <section className='py-16 md:py-20 bg-background'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Title and Description */}
        <SectionHeading
          heading="Your Path to Investment Success"
          subheading="Pre-Construction Journey"
          description="Start your journey with expert guidance and access to the best pre-construction opportunities across Canada."
          position="center"
        />

        {/* Grid of 3 Blocks */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-10'>
          {/* Guides & Insights */}
          <div className='rounded-xl p-6 bg-white shadow-sm hover:translate-y-[-10px] transition-all duration-300'>
            <div className='flex flex-col h-full'>
              <div className='flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
                <BookOpen className='w-6 h-6 text-primary' />
              </div>
              <h3 className='text-black text-lg md:text-xl mb-3 font-semibold'>Guides & Insights</h3>
              <p className='text-gray-500 text-sm mb-4 flex-1 leading-relaxed'>Start your journey with our Ultimate Guide to Investing in Pre-Construction Real Estate and learn how to secure early-stage opportunities like a pro.</p>
              <Link href="/guides/pre-construction-investing">
                <Button className='bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg w-full'>
                  Read the Guide
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Pre-Construction Projects */}
          <div className='rounded-xl p-6 bg-white shadow-sm hover:translate-y-[-10px] transition-all duration-300'>
            <div className='flex flex-col h-full'>
              <div className='flex-shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4'>
                <Search className='w-6 h-6 text-secondary' />
              </div>
              <h3 className='text-black text-lg md:text-xl mb-3 font-semibold'>Search Pre-Construction Projects</h3>
              <p className='text-gray-500 text-sm mb-4 flex-1 leading-relaxed'>Find your next great investment across Canada's top cities — get first access to upcoming condo, townhouse, and detached home developments before they hit the public market.</p>
              <Link href="/pre-con">
                <Button className='bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg w-full'>
                  Browse Projects
                </Button>
              </Link>
            </div>
          </div>

          {/* Invest with Confidence */}
          <div className='rounded-xl p-6 bg-white shadow-sm hover:translate-y-[-10px] transition-all duration-300'>
            <div className='flex flex-col h-full'>
              <div className='flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4'>
                <TrendingUp className='w-6 h-6 text-accent' />
              </div>
              <h3 className='text-black text-lg md:text-xl mb-3 font-semibold'>Invest with Confidence</h3>
              <p className='text-gray-500 text-sm mb-4 flex-1 leading-relaxed'>Our clients receive priority access and exclusive incentives on the hottest new launches — helping them save thousands and maximize returns.</p>
              <Link href="/pre-con">
                <Button className='bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg w-full'>
                  Start Investing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PreConstructionJourney

