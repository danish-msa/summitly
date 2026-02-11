"use client";

import React from "react";

/** Simple line chart visual for Rent Zestimate history overlay */
const RentZestimateChart: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[140px] flex flex-col p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm font-semibold text-zinc-800 mb-2">
        Rent Zestimate history
      </h3>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] sm:text-xs text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded-full bg-blue-500" aria-hidden />
          This home $2,400/mon
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded-full bg-red-500" aria-hidden />
          Queen anne $3,534/mon
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded-full bg-emerald-500" aria-hidden />
          Seattle $2,964/mon
        </span>
      </div>
      <div className="flex-1 min-h-[80px] relative">
        <svg
          viewBox="0 0 200 80"
          className="w-full h-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Blue line - This home */}
          <polyline
            points="0,60 40,55 80,45 120,35 160,30 200,25"
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Red line - Queen anne */}
          <polyline
            points="0,70 40,50 80,40 120,32 160,28 200,25"
            fill="none"
            stroke="rgb(239 68 68)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Green line - Seattle */}
          <polyline
            points="0,55 40,48 80,42 120,38 160,32 200,25"
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] sm:text-xs text-zinc-500 mt-1">
        <span>2016</span>
        <span>2017</span>
        <span>2018</span>
        <span>2019</span>
        <span>2020</span>
      </div>
      <p className="text-[10px] sm:text-xs text-zinc-600 mt-1 font-medium">
        $2,964/mon
      </p>
    </div>
  );
};

export default RentZestimateChart;
