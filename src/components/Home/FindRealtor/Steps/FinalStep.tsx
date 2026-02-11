"use client";

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { FormData } from '../types';
import AuthModal from '@/components/Auth/AuthModal';

interface FinalStepProps {
  formData: FormData;
  handleLogin: () => void;
  handleSignUp: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const FinalStep: React.FC<FinalStepProps> = ({
  containerVariants,
  itemVariants
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-2xl mx-auto text-center"
      >
        <motion.h2 variants={itemVariants} className="text-2xl mb-6 text-gray-800">
          Great! We're ready to connect you with a realtor
        </motion.h2>
        
        <motion.p variants={itemVariants} className="mb-8 text-gray-600">
          To see your matched realtors, please log in or create an account.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleLoginClick}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
          >
            Log In
          </button>
        </motion.div>
      </motion.div>

      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default FinalStep;