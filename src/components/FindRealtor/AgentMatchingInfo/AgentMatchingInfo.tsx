"use client";

import React from "react";
import Link from "next/link";
import { FaHandshake, FaChartLine, FaMoneyBillWave } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const AgentMatchingInfo: React.FC = () => {
  return (
    <div className="py-16 bg-white">
      <div className="w-[90%] max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            The Right Realtor for You. Guaranteed.
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We use powerful intel to analyze agents based on their real track
            record, performance, and local area expertise, matching them to your
            unique needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="shadow-card p-8 rounded-2xl text-center">
            <FaChartLine
              className="mx-auto text-4xl text-primary mb-4"
              aria-hidden
            />
            <h3 className="text-xl mb-3 text-gray-800 font-bold">
              Data-Driven Matching
            </h3>
            <p className="text-gray-600">
              We analyze agents based on their performance, track record, and
              local expertise to find your perfect match.
            </p>
          </div>

          <div className="shadow-card p-8 rounded-2xl text-center">
            <FaHandshake
              className="mx-auto text-4xl text-secondary mb-4"
              aria-hidden
            />
            <h3 className="text-xl mb-3 text-gray-800 font-bold">
              Perfect Match Guarantee
            </h3>
            <p className="text-gray-600">
              If your initial match isn&apos;t right, we&apos;ll keep searching
              until you find the perfect agent for your needs.
            </p>
          </div>

          <div className="shadow-card p-8 rounded-2xl text-center">
            <FaMoneyBillWave
              className="mx-auto text-4xl text-green-600 mb-4"
              aria-hidden
            />
            <h3 className="text-xl mb-3 text-gray-800 font-bold">
              Cashback Rewards
            </h3>
            <p className="text-gray-600">
              Work with select agents and receive up to 1% cashback after
              closing on your new home purchase.
            </p>
          </div>
        </div>

        <div className="bg-primary p-8 md:p-12 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:flex-1 text-center md:text-left">
              <h3 className="text-2xl text-white mb-3 font-bold">
                The Smarter Way to Buy &amp; Sell
              </h3>
              <p className="text-white/90">
                A smart move starts with us. Expert Realtors with unique
                data-driven insights and up to 1% cashback – it all adds up to a
                better real estate experience.
              </p>
            </div>
            <div className="shrink-0">
              <Button
                variant="secondary"
                asChild
                className="bg-secondary text-white py-3 px-8 rounded-lg font-semibold hover:bg-primary-dark transition-all"
              >
                <Link href="/about">LEARN MORE</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMatchingInfo;
