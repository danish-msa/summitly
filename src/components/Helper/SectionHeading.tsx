import React from 'react'

type Props = {
    heading: string,
    subheading: string,
    description: string,
    position?: 'left' | 'center'
}

const SectionHeading = ({heading, subheading, description, position = 'center'}: Props) => {
  const alignmentClasses = position === 'left' ? 'items-start justify-start' : 'items-center justify-center'
  const textAlignment = position === 'left' ? 'text-left' : 'text-center'
  
  return (
    <div>
        <div className={`flex ${alignmentClasses} mb-4`}>
          <span className='inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1 rounded-full text-base font-medium'>
            <span className='w-2 h-2 bg-secondary rounded-full'></span>
            {subheading}
          </span>
        </div>
        <h2 className={`text-2xl md:text-4xl ${textAlignment} font-bold mb-2 text-primary`}>{heading}</h2>
        <p className={`text-lg text-text ${textAlignment} mt-4`}>{description}</p>
    </div>
  )
}

export default SectionHeading