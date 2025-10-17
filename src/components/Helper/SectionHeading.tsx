import React from 'react'

type Props = {
    heading: string,
    subheading: string,
    description: string
}

const SectionHeading = ({heading, subheading, description}: Props) => {
  return (
    <div>
        <div className='flex items-center justify-center mb-4'>
          <span className='inline-flex items-center gap-2 uppercase bg-secondary/10 text-secondary px-4 py-1 rounded-full text-base font-medium'>
            <span className='w-2 h-2 bg-secondary rounded-full'></span>
            {subheading}
          </span>
        </div>
        <h2 className='text-2xl md:text-4xl text-center font-bold mb-2 text-primary'>{heading}</h2>
        <p className='text-lg text-text text-center mt-4'>{description}</p>
    </div>
  )
}

export default SectionHeading