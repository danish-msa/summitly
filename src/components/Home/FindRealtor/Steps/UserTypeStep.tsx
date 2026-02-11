"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { UserType } from '../types';

interface UserTypeStepProps {
  handleUserTypeSelect: (type: UserType) => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const UserTypeStep: React.FC<UserTypeStepProps> = ({ 
  handleUserTypeSelect, 
  itemVariants, 
  containerVariants 
}) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="text-center"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-800">
        Find the Right REALTOR® for you
      </motion.h2>
      <motion.p variants={itemVariants} className="text-lg mb-10 text-gray-600">
        I am...
      </motion.p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleUserTypeSelect('buyer')}
          className="bg-primary text-white py-4 px-8 rounded-lg text-lg font-semibold shadow-lg hover:bg-primary-dark transition-all"
        >
          A BUYER
        </motion.button>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleUserTypeSelect('seller')}
          className="bg-secondary text-white py-4 px-8 rounded-lg text-lg font-semibold shadow-lg hover:bg-secondary-dark transition-all"
        >
          A SELLER
        </motion.button>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleUserTypeSelect('both')}
          className="bg-gray-700 text-white py-4 px-8 rounded-lg text-lg font-semibold shadow-lg hover:bg-gray-800 transition-all"
        >
          BOTH
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UserTypeStep;