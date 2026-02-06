import React from "react";
import Hero from "./Hero/Hero";
import SavingsCalculation from "../Home/SavingsCalculation/SavingsCalculation";
import { OurAgentsSection } from "@/components/common/OurAgentsSection";

const Buy = () => {
  return (
    <div className="bg-white">
      <Hero />
      <SavingsCalculation />
      <OurAgentsSection />
    </div>
  );
};

export default Buy