import { useState } from "react";
import { DemographicsProps } from './types';
import { demographicStats } from './mockData';
import { StatisticsGrid } from './StatisticsGrid';
import { DemographicsMap } from './DemographicsMap';
import { DemographicsTabs } from './DemographicsTabs';

const NeighbourhoodDemographics = ({ latitude, longitude, address }: DemographicsProps) => {
  const [activeTab, setActiveTab] = useState("income");

  return (
    <div className="w-full">
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-1">
          Gain quick insights into local demographics with Statistics Canada's data on this Dissemination Area. 
          A dissemination area is essentially a small neighbourhood consisting of 400 to 700 residents.
        </p>
        <div className="py-6">
          {/* Map */}
          <DemographicsMap latitude={latitude} longitude={longitude} address={address} />

          {/* Key Statistics Grid */}
          <StatisticsGrid stats={demographicStats} />

          {/* Tabs and Charts */}
          <DemographicsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
};

export default NeighbourhoodDemographics;

