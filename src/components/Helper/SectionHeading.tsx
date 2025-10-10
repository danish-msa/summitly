import React from 'react'

type Props = {
    heading: string,
    subheading: string,
    description: string
}

const SectionHeading = ({heading, subheading, description}: Props) => {
  return (
    <div>
        <span className='text-lg block text-center mb-2 font-normal text-secondary'>{subheading}</span>
        <h2 className='text-2xl md:text-4xl text-center font-normal mb-2 text-primary'>{heading}</h2>
        <p className='text-lg text-text text-center mt-4'>{description}</p>
    </div>
  )
}

export default SectionHeading