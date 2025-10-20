"use client"
import React from 'react';
import Hero from './Hero/Hero';
import ApartmentType from './ApartmentType/ApartmentType';
import Properties from './Properties/Properties';
import CityProperties from './CityProperties/CityProperties';
import BuildingFeature from './BuildingFeature/BuildingFeature';
import ClientReviews from './ClientReviews/ClientReviews';
import Blogs from './Blogs/Blogs';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ConnectWithUs from './ConnectWithUs/ConnectWithUs';
import WhyChooseUs from './WhyChooseUs/WhyChooseUs';
import FeaturedIn from './FeaturedIn/FeaturedIn';
import AsSeenOn from './AsSeenOn/AsSeenOn';
import CallToAction from './CallToAction/CallToAction';
import CallToAction2 from '../About/CallToAction/CallToAction';
import ExploreHotCities from './ExploreHotCities/ExploreHotCities';
import ServiceFeatures from './ServiceFeatures/ServiceFeatures';
import PropertyCategories from './PropertyCategories/PropertyCategories';
import PropertyDiscovery from './PropertyDiscovery/PropertyDiscovery';

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
            
            <FeaturedIn />
            {/* <BuyerAndSeller /> */}
            <Properties />
            {/* <WhatWeDo /> */}
            <CallToAction2 />
            {/* <FeatureGrid /> */}
            <ServiceFeatures />
            
            
            <PropertyDiscovery />
            
            
            {/* <BuyingPowerCalculator /> */}
            {/* <SavingsCalculation /> */}
            <CityProperties />
            <CallToAction />
            
            <WhyChooseUs />
            {/* <Condos /> */}
            <BuildingFeature />
            
            {/* <ApartmentType /> */}
            {/* <OurAgents /> */}
            <ExploreHotCities />
            <ConnectWithUs />
            <ClientReviews />
            <Blogs />
        </div>
    );
};

export default Home;