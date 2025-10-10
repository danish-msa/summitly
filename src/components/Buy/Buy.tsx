import React from 'react'
import Hero from './Hero/Hero'
import SavingsCalculation from '../Home/SavingsCalculation/SavingsCalculation'
import OurAgents from '../Home/OurAgents/OurAgents'

const Buy = () => {
  return (
    <div className='bg-white'>
        <Hero/>
        <SavingsCalculation/>
        <OurAgents/>
    </div>
  )
}

export default Buy