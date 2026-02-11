"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FaHome, FaBuilding, FaCity, FaWarehouse } from 'react-icons/fa';
import { FormData } from '../types';

interface PropertyTypeStepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formData,
  setFormData,
  handlePrevStep,
  handleNextStep,
  itemVariants,
  containerVariants
}) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-2xl mx-auto"
    >
      <motion.h2 variants={itemVariants} className="text-2xl font-bold mb-6 text-gray-800">
        What type of property are you looking for?
      </motion.h2>
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { type: 'Detached', icon: FaHome },
          { type: 'Semi-detached', icon: FaBuilding },
          { type: 'Townhouse', icon: FaCity },
          { type: 'Condominium', icon: FaWarehouse }
        ].map(({ type, icon: Icon }) => (
          <div 
            key={type}
            onClick={() => setFormData({...formData, propertyType: type})}
            className={`border ${
              formData.propertyType === type ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
            } flex flex-col justify-center rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-all`}
          >
            <Icon className={`${ formData.propertyType === type ? 'text-white' : 'text-black'
            } mx-auto mb-2 text-4xl `} />
            <p className={`${ formData.propertyType === type ? 'text-white' : 'text-black'} text-sm`}>{type}</p>
          </div>
        ))}
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
          disabled={!formData.propertyType}
          className={`px-6 py-2 rounded-lg text-white transition-all ${
            formData.propertyType ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PropertyTypeStep;