import React from 'react'
import Hero from './Hero/Hero'
import AgentMatchingInfo from './AgentMatchingInfo/AgentMatchingInfo'

const Agents: React.FC = () => {
  return (
    <div className='bg-white'>
        <Hero/>
        <AgentMatchingInfo/>
    </div>
  )
}

export default Agents