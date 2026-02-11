import React from 'react'
import Image from 'next/image'

const AsSeenOn = () => {
  const logos = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png']
  
  // Duplicate logos for seamless infinite loop
  const duplicatedLogos = [...logos, ...logos]

  return (
    <section className="overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {/* <p className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0 z-10 relative">
            As seen on:
          </p>
           */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-8 md:gap-12 animate-marquee will-change-transform">
              {duplicatedLogos.map((fileName, index) => (
                <Image
                  key={`${fileName}-${index}`}
                  src={`/images/media/${fileName}`}
                  alt={`Press logo ${(index % logos.length) + 1}`}
                  width={200}
                  height={200}
                  className=" w-auto opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                  priority={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AsSeenOn
