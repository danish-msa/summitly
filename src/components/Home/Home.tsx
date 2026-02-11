"use client"
import React, { lazy, Suspense } from 'react';
import Hero from './Hero/Hero';
import AsSeenOn from './AsSeenOn/AsSeenOn';
import PropertyCategories from './PropertyCategories/PropertyCategories';
import CallToAction3 from './CallToAction3/CallToAction3';
import ServiceFeatures from './ServiceFeatures/ServiceFeatures';
import CallToAction2 from '../About/CallToAction/CallToAction';
// AOS CSS - loaded normally (small file)
import 'aos/dist/aos.css';

// Lazy load heavy components that aren't immediately visible
const Properties = lazy(() => import('./Properties/Properties'));
const PreConstruction = lazy(() => import('./PreConstruction/PreConstruction'));

// Lazy load AOS library (animation library) - CSS is imported separately
const loadAOS = () => {
  return import('aos').then((module) => module.default);
};

// Lazy load below-fold components for better initial load performance
const CityProperties = lazy(() => import('./CityProperties/CityProperties'));
const ClientReviews = lazy(() => import('./ClientReviews/ClientReviews'));
const Blogs = lazy(() => import('./Blogs/Blogs'));
const ConnectWithUs = lazy(() => import('./ConnectWithUs/ConnectWithUs'));
const WhyChooseUs = lazy(() => import('./WhyChooseUs/WhyChooseUs'));
const CallToAction = lazy(() => import('./CallToAction/CallToAction'));
const FAQ = lazy(() => import('./FAQ/FAQ'));
const RecommendationsSection = lazy(() => import('./Recommendations/RecommendationsSection').then(module => ({ default: module.RecommendationsSection })));

// Loading fallback component
const SectionLoader = () => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const Home: React.FC = () => {
    // Lazy load AOS only when needed (after initial render)
    React.useEffect(() => {
        // Defer AOS loading to improve initial page load
        const timer = setTimeout(() => {
            loadAOS().then((AOS) => {
                AOS.init({
                    duration: 1000,
                    easing: 'ease-in',
                    once: true,
                    anchorPlacement: 'top-bottom'
                });
            });
        }, 100); // Small delay to prioritize critical content

        return () => clearTimeout(timer);
    }, []);



    return (
        <div className=''>
            <Hero />
            <AsSeenOn />
            <PropertyCategories />
            <CallToAction3 />
            
            {/* Lazy load Properties and PreConstruction - they make API calls */}
            <Suspense fallback={<SectionLoader />}>
                <Properties />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <PreConstruction />
            </Suspense>
            
            <ServiceFeatures />
            <CallToAction2 />
            
            {/* Lazy loaded below-fold sections */}
            <Suspense fallback={<SectionLoader />}>
                <RecommendationsSection />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <CityProperties />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <CallToAction />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <WhyChooseUs />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <ConnectWithUs />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <ClientReviews />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Blogs />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <FAQ />
            </Suspense>
        </div>
    );
};

export default Home;