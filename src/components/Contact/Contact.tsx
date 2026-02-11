import React from 'react';
import Banner from './Banner/Banner';
import ContactForm from './ContactForm/ContactForm';
import CallToAction from './CallToAction/CallToAction';

const Contact: React.FC = () => {
  return (
    <div className='overflow-hidden bg-white'>
      <Banner />
      <ContactForm />
      <CallToAction />
    </div>
  );
};

export default Contact;