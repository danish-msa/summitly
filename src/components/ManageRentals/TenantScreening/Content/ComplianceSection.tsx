"use client";

import React from "react";
import { Shield } from "lucide-react";

const ComplianceSection: React.FC = () => {
  return (
    <section
      className="bg-white"
      aria-labelledby="compliance-heading"
    >
      <div className="container-1400 mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <p className="text-sky-600 text-sm font-medium flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" aria-hidden />
              Compliance First
            </p>
            <h2
              id="compliance-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-4"
            >
              Screen tenants fairly with industry-leading filtering tools
            </h2>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed">
              Summitly helps rental partners screen tenants compliantly by
              partnering with industry-leading credit and background check
              providers that filter the information provided to meet local
              tenant screening laws and regulations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 lg:justify-end">
            <span className="text-xl font-bold text-zinc-900">Experian</span>
            <span className="flex items-center gap-2">
              <span className="text-xl font-bold text-zinc-900">CIC</span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-zinc-600">
                Reports
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComplianceSection;
