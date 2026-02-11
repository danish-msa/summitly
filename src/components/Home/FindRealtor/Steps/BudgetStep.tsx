"use client";

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion'; // Import Variants from framer-motion
import { Range, getTrackBackground } from 'react-range';
import { FormData } from '../types';

interface BudgetStepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  setFormData,
  handlePrevStep,
  handleNextStep,
  itemVariants,
  containerVariants
}) => {
  // Local state for the slider values
  const [values, setValues] = useState([formData.priceRange.min, formData.priceRange.max]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle range change
  const handleRangeChange = (newValues: number[]) => {
    setValues(newValues);
    setFormData(prev => ({
      ...prev,
      priceRange: {
        min: newValues[0],
        max: newValues[1]
      }
    }));
  };

  // Update budget text field
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      budget: e.target.value
    }));
  };

  // Sync local state with formData
  useEffect(() => {
    setValues([formData.priceRange.min, formData.priceRange.max]);
  }, [formData.priceRange]);

  const MIN = 100000;
  const MAX = 2000000;
  const STEP = 10000;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-2xl mx-auto"
    >
      <motion.h2 variants={itemVariants} className="text-2xl mb-6 text-gray-800">
        What's your budget?
      </motion.h2>
      
      <motion.div variants={itemVariants} className="mb-8">
        <div className="mb-6">
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
            Enter your budget (optional)
          </label>
          <input
            type="text"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleBudgetChange}
            placeholder="e.g., $500,000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Price Range</span>
            <span className="text-sm font-medium text-gray-800">
              {formatCurrency(values[0])} - {formatCurrency(values[1])}
            </span>
          </div>
          
          <div className="py-6">
            <Range
              values={values}
              step={STEP}
              min={MIN}
              max={MAX}
              onChange={handleRangeChange}
              renderTrack={({ props, children }) => (
                <div
                  onMouseDown={props.onMouseDown}
                  onTouchStart={props.onTouchStart}
                  style={{
                    ...props.style,
                    height: '36px',
                    display: 'flex',
                    width: '100%'
                  }}
                >
                  <div
                    ref={props.ref}
                    style={{
                      height: '5px',
                      width: '100%',
                      borderRadius: '4px',
                      background: getTrackBackground({
                        values,
                        colors: ['#ccc', '#3B82F6', '#ccc'],
                        min: MIN,
                        max: MAX
                      }),
                      alignSelf: 'center'
                    }}
                  >
                    {children}
                  </div>
                </div>
              )}
              renderThumb={({ props, isDragged }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: '20px',
                    width: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#FFF',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0px 2px 6px #AAA',
                    border: '2px solid #3B82F6'
                  }}
                >
                  <div
                    style={{
                      height: '8px',
                      width: '8px',
                      backgroundColor: isDragged ? '#3B82F6' : '#CCC',
                      borderRadius: '50%'
                    }}
                  />
                </div>
              )}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatCurrency(MIN)}</span>
            <span>{formatCurrency(MAX)}</span>
          </div>
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

export default BudgetStep;