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
import WhatWeDo from './WhatWeDo/WhatWeDo';
import WhyChooseUs from './WhyChooseUs/WhyChooseUs';
import OurAgents from './OurAgents/OurAgents';
import FeaturedIn from './FeaturedIn/FeaturedIn';
import CallToAction from './CallToAction/CallToAction';
import CallToAction2 from '../About/CallToAction/CallToAction';
import ExploreHotCities from './ExploreHotCities/ExploreHotCities';
import BuyerAndSeller from './BuyerAndSeller/BuyerAndSeller';
import FeatureGrid from './FeatureGrid/FeatureGrid';
import Condos from './Condos/Condos';
import SavingsCalculation from './SavingsCalculation/SavingsCalculation';
import PropertyCategories from './PropertyCategories/PropertyCategories';

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
            <PropertyCategories />
            {/* <BuyerAndSeller /> */}
            <Properties />
            <WhatWeDo />
            <FeatureGrid />
            <ApartmentType />
            <FeaturedIn />
            
            
            <SavingsCalculation />
            <CityProperties />
            <CallToAction />
            
            <WhyChooseUs />
            <Condos />
            <BuildingFeature />
            <CallToAction2 />
            <OurAgents />
            <ExploreHotCities />
            <ConnectWithUs />
            <ClientReviews />
            <Blogs />
        </div>
    );
};

export default Home;