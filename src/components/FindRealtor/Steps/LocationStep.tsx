"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { AutocompleteSearch } from "@/components/common/AutocompleteSearch";
import { FormData } from "../types";

interface LocationStepProps {
  userType: string | null;
  formData: FormData;
  onLocationSelect: (locationName: string) => void;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const LocationStep: React.FC<LocationStepProps> = ({
  userType,
  formData,
  onLocationSelect,
  handlePrevStep,
  handleNextStep,
  itemVariants,
  containerVariants,
}) => {
  const isLocationSelected = !!formData.location;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-2xl mx-auto"
    >
      <motion.h2 variants={itemVariants} className="text-2xl font-bold mb-6 text-gray-800">
        Where are you looking to {userType === "seller" ? "sell" : "buy"} property?
      </motion.h2>

      <motion.div variants={itemVariants} className="mb-8">
        <AutocompleteSearch
          placeholder="Enter city, neighborhood, or address"
          locationsOnly
          onSelectLocation={(loc) => onLocationSelect(loc.name ?? "")}
          className="w-full"
          inputClassName="border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </motion.div>

      <div className="flex justify-between">
        <motion.button
          variants={itemVariants}
          onClick={handlePrevStep}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
        >
          Back
        </motion.button>
        <motion.button
          variants={itemVariants}
          onClick={handleNextStep}
          disabled={!isLocationSelected}
          className={`px-6 py-2 rounded-lg text-white transition-all ${
            isLocationSelected ? "bg-primary hover:bg-primary-dark" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LocationStep;
