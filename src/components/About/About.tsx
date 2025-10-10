import React from 'react';
import Banner from './Banner/Banner';
import CallToAction from './CallToAction/CallToAction';
import OurAgents from '../Home/OurAgents/OurAgents';
import ClientReviews from './ClientReviews/ClientReviews';

const About: React.FC = () => {
  return (
    <div className='overflow-hidden bg-white'>
      <Banner />
      <OurAgents />
      <ClientReviews />
      <CallToAction />
    </div>
  );
};

export default About;