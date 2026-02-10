import React from "react";
import Hero from "./Hero/Hero";
import BuyPageListingsSection from "./BuyPageListingsSection/BuyPageListingsSection";
import NewestListingsSection from "./NewestListingsSection/NewestListingsSection";
import OpenHousesSection from "./OpenHousesSection/OpenHousesSection";
import AffordableHomesSection from "./AffordableHomesSection/AffordableHomesSection";
import LuxuryHomesSection from "./LuxuryHomesSection/LuxuryHomesSection";
import SavingsCalculation from "../Home/SavingsCalculation/SavingsCalculation";
import { OurAgentsSection } from "@/components/common/OurAgentsSection";

const Buy = () => {
  return (
    <div className="bg-white">
      <Hero />
      <BuyPageListingsSection />
      <NewestListingsSection />
      <OpenHousesSection />
      <AffordableHomesSection />
      <LuxuryHomesSection />
      <SavingsCalculation />
      <OurAgentsSection />
    </div>
  );
};

export default Buy