"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FormData } from '../types';

interface MortgageStepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const MortgageStep: React.FC<MortgageStepProps> = ({
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
      <motion.h2 variants={itemVariants} className="text-2xl mb-6 text-gray-800">
        Are you pre-approved for a mortgage?
      </motion.h2>
      <motion.div variants={itemVariants} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setFormData({...formData, mortgage: true})}
            className={`py-4 px-6 rounded-lg text-center transition-all ${
              formData.mortgage === true 
                ? 'bg-primary text-white border-primary' 
                : 'border border-gray-300 hover:border-primary'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className={`${ formData.mortgage === true 
                ? 'text-white' : 'text-primary' } font-medium`}>Yes, I am pre-approved</span>
            </div>
          </button>
          
          <button
            onClick={() => setFormData({...formData, mortgage: false})}
            className={`py-4 px-6 rounded-lg text-center transition-all ${
              formData.mortgage === false && formData.mortgage !== undefined
                ? 'bg-primary text-white border-primary' 
                : 'border border-gray-300 hover:border-primary'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className={`${ formData.mortgage === false && formData.mortgage !== undefined
                ? 'text-white' : 'text-primary' } font-medium`}>No, I am not yet pre-approved</span>
            </div>
          </button>
        </div>
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
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MortgageStep;