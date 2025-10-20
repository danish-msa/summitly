import React from 'react'
import Image from 'next/image'

const AsSeenOn = () => {
  return (
    <section className=" bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-center items-center gap-6">
          <p className="text-sm font-medium text-muted-foreground">
            As seen on:
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['press_1.svg', 'press_2.svg', 'press_3.svg', 'press_4.svg'].map((fileName, index) => (
              <Image
                key={fileName}
                src={`/images/${fileName}`}
                alt={`Press logo ${index + 1}`}
                width={120}
                height={40}
                className="h-6 md:h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
                priority={false}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AsSeenOn
