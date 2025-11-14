"use client";

import React from 'react';

interface AboutReportSectionProps {
  cityName: string;
  dateRange: string;
}

export const AboutReportSection: React.FC<AboutReportSectionProps> = ({ cityName, dateRange }) => {
  return (
    <section id="about-report" className="py-8">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-foreground mb-6">About this Report</h2>
        
        <div className="space-y-4 text-muted-foreground">
          <p>
            See a current overview of the housing market with Summitly's {cityName} real estate market trends. If you're curious about your city's average house price, housing inventory, or how long it takes to sell a home, all this has now been broken down for you. Our home price data is always updated. This report goes over sales history between {dateRange} and measures it against the same period last year. These real estate statistics are paired with rankings of all cities in the Greater {cityName} area based on home sold price, price growth, days on market, and turnover. This way, you get to see the {cityName} housing market on a larger scale, and how it contrasts with other cities in the metro area. All this data is intended to give you a thorough understanding of both the local {cityName} and the Greater {cityName} area, so that in the end, you'll be able to make a well-informed decision about where you'd like to live. In addition to our market analysis, consider referencing other MLS® stats, like the MLS® Home Price Index, to get a more rounded view of the market.
          </p>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Numbers are based on firm contract dates, not when the transaction is reported or when the contract closes.</h3>
            <p>
              A contract is firm when both the home seller and buyer agree to the transaction, however this may not be reported in a timely fashion. Therefore, transaction reported dates are when the agent submits the sale to their local board. A contract is closed when the transaction actually occurs and the buyers move into the house. Normally, contracts close about 6-8 weeks after a contract is firm, which means the data you're seeing is reported in real-time.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Data is reported in 4 or 8 week periods.</h3>
            <p>
              28 and 56 day periods are used because some months have more weekends than others. This ensures that each period has the same amount of days and weekends so that a like-for-like comparison can be made.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">What does pro-rated data mean?</h3>
            <p>
              Based on historical reporting, it can take up to four weeks or more for transactions to be reported. This means that approximately 30% of home transactions that occured within this period have yet to be included in this report. Because of this, this period's numbers are considered "pro-rated."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

