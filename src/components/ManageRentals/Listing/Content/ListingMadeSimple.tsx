"use client";

import React from "react";
import Image from "next/image";

const ListingMadeSimple: React.FC = () => {
  return (
    <section
      className="container-1400 mx-auto bg-muted/20 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="listing-simple-heading"
    >
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Building image + chat image at bottom-left */}
          <div className="relative order-2 lg:order-1 min-h-[320px] sm:min-h-[400px] rounded-xl">
            <Image
              src="/images/managerentals/listing-2.jpg"
              alt="Contemporary residential building"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-xl"
            />
            <div
              className="absolute bottom-0 right-0 sm:left-auto sm:w-[380px] aspect-[4/3] overflow-hidden"
              aria-hidden
            >
              <Image
                src="/images/managerentals/chat.png"
                alt=""
                fill
                sizes="100%"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Heading + three sections */}
          <div className="order-1 lg:order-2">
            <h2
              id="listing-simple-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-8"
            >
              Listing made simple
            </h2>
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-lg font-bold text-secondary mb-2">
                  Create your rental listings
                </h3>
                <p className="text-zinc-600 text-sm sm:text-base">
                  It takes just minutes to create a listing — simply add
                  property details, upload photos and publish.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary mb-2">
                  Message interested renters
                </h3>
                <p className="text-zinc-600 text-sm sm:text-base">
                  Communicate with renters using Summitly Rental Manager to stay
                  organized during the tenant search process.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary mb-2">
                  Reuse your rental posting
                </h3>
                <p className="text-zinc-600 text-sm sm:text-base">
                  Time for new renters? We save your listings so you can
                  republish them with the click of a button.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingMadeSimple;
