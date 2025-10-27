"use client"
import React from 'react';
import Hero from './Hero/Hero';
import Properties from './Properties/Properties';
import CityProperties from './CityProperties/CityProperties';
import ClientReviews from './ClientReviews/ClientReviews';
import Blogs from './Blogs/Blogs';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ConnectWithUs from './ConnectWithUs/ConnectWithUs';
import WhyChooseUs from './WhyChooseUs/WhyChooseUs';
import AsSeenOn from './AsSeenOn/AsSeenOn';
import CallToAction from './CallToAction/CallToAction';
import CallToAction2 from '../About/CallToAction/CallToAction';
import ServiceFeatures from './ServiceFeatures/ServiceFeatures';
import PropertyCategories from './PropertyCategories/PropertyCategories';
import FAQ from './FAQ/FAQ';
import CallToAction3 from './CallToAction3/CallToAction3';
import { RecommendationsSection } from './Recommendations/RecommendationsSection';

const Home: React.FC = () => {

    React.useEffect(() => {
        AOS.init({
            duration: 1000,
            easing: 'ease-in',
            once: true,
            anchorPlacement: 'top-bottom'
        });
    }, []);



    return (
        <div className=''>
            <Hero />
            <AsSeenOn />
            <PropertyCategories />
            <CallToAction3 />
            <Properties />
            <ServiceFeatures />
            <CallToAction2 />
            <RecommendationsSection />
            <CityProperties />
            <CallToAction />
            <WhyChooseUs />
            <ConnectWithUs />
            <ClientReviews />
            <Blogs />
            <FAQ />
            {/* <Condos /> */}
            {/* <BuildingFeature /> */}
            {/* <ApartmentType /> */}
            {/* <OurAgents /> */}
            {/* <ExploreHotCities /> */}
            {/* <BuyingPowerCalculator /> */}
            {/* <SavingsCalculation /> */}
            {/* <PropertyDiscovery /> */}
            {/* <WhatWeDo /> */}
            {/* <FeatureGrid /> */}
            {/* <FeaturedIn /> */}
            {/* <BuyerAndSeller /> */}
        </div>
    );
};

export default Home;