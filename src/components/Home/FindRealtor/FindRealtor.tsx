"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

// Import step components
import UserTypeStep from './Steps/UserTypeStep';
import LocationStep from './Steps/LocationStep';
import PropertyTypeStep from './Steps/PropertyTypeStep';
import BudgetStep from './Steps/BudgetStep';
import MortgageStep from './Steps/MortgageStep';
import FinalStep from './Steps/FinalStep';

// Import types
import { UserType, Step, FormData } from './types';

// Add or update the interface for FindRealtor props
interface FindRealtorProps {
  initialUserType: 'buyer' | 'seller' | 'both' | null;
}

const FindRealtor: React.FC<FindRealtorProps> = ({ initialUserType }) => {
  const router = useRouter();
  // Initialize userType with initialUserType if provided
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [currentStep, setCurrentStep] = useState<Step>(initialUserType ? 'location' : 'userType');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    cities: Array<{name: string, region: string}>;
    neighborhoods: Array<{name: string, city: string, region: string}>;
  }>({
    cities: [],
    neighborhoods: []
  });
  
  const [formData, setFormData] = useState<FormData>({
    location: '',
    propertyType: '',
    budget: '',
    priceRange: { min: 300000, max: 1000000 },
    mortgage: false
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  // Handle user type selection
  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setCurrentStep('location');
  };

  // Handle location input change
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchTerm(value);
    // Also update formData.location directly when typing
    setFormData(prev => ({...prev, location: value}));
    getSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  // In the parent component
  const handleSuggestionSelect = (suggestion: string) => {
    // Update both state variables with the same value
    setSearchTerm(suggestion);
    setFormData(prev => ({
      ...prev,
      location: suggestion
    }));
    setShowSuggestions(false);
  };

  // Mock function to get suggestions - in a real app, this would call an API
  const getSuggestions = (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions({ cities: [], neighborhoods: [] });
      return;
    }
    
    // Mock data - in a real app, this would come from an API
    const mockCities = [
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)}ville`, region: 'ON' },
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)}town`, region: 'BC' },
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)}city`, region: 'AB' },
    ];
    
    const mockNeighborhoods = [
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)} Heights`, city: 'Toronto', region: 'ON' },
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)} Park`, city: 'Vancouver', region: 'BC' },
      { name: `${term.charAt(0).toUpperCase() + term.slice(1)} Village`, city: 'Montreal', region: 'QC' },
    ];
    
    setSuggestions({
      cities: mockCities,
      neighborhoods: mockNeighborhoods
    });
  };

  // Handle next step
  const handleNextStep = () => {
    switch (currentStep) {
      case 'userType':
        setCurrentStep('location');
        break;
      case 'location':
        setCurrentStep('propertyType');
        break;
      case 'propertyType':
        setCurrentStep('budget');
        break;
      case 'budget':
        setCurrentStep('mortgage');
        break;
      case 'mortgage':
        setCurrentStep('final');
        break;
      default:
        break;
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    switch (currentStep) {
      case 'location':
        setCurrentStep('userType');
        break;
      case 'propertyType':
        setCurrentStep('location');
        break;
      case 'budget':
        setCurrentStep('propertyType');
        break;
      case 'mortgage':
        setCurrentStep('budget');
        break;
      case 'final':
        setCurrentStep('mortgage');
        break;
      default:
        break;
    }
  };

  // Handle login
  const handleLogin = () => {
    router.push('/login');
  };

  // Handle sign up
  const handleSignUp = () => {
    router.push('/signup');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Keep searchTerm and formData.location in sync
  useEffect(() => {
    if (formData.location !== searchTerm) {
      setSearchTerm(formData.location);
    }
  }, [formData.location]);

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'userType':
        return (
          <UserTypeStep 
            handleUserTypeSelect={handleUserTypeSelect}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case 'location':
        return (
          <LocationStep 
            userType={userType}
            searchTerm={searchTerm}
            showSuggestions={showSuggestions}
            suggestions={suggestions}
            formData={formData}
            handleLocationInputChange={handleLocationInputChange}
            handleSuggestionSelect={handleSuggestionSelect}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case 'propertyType':
        return (
          <PropertyTypeStep 
            formData={formData}
            setFormData={setFormData}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case 'budget':
        return (
          <BudgetStep 
            formData={formData}
            setFormData={setFormData}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case 'mortgage':
        return (
          <MortgageStep 
            formData={formData}
            setFormData={setFormData}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case 'final':
        return (
          <FinalStep 
            formData={formData}
            handleLogin={handleLogin}
            handleSignUp={handleSignUp}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      default:
        return null;
    }
  };

  // Progress bar calculation
  const calculateProgress = () => {
    const steps = ['userType', 'location', 'propertyType', 'budget', 'mortgage', 'final'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex) / (steps.length - 1)) * 100;
  };

  return (
    <div className="md:h-screen py-24 bg-gray-50 flex items-center">
      <div className="w-[90%] max-w-4xl mx-auto">
        {currentStep !== 'userType' && (
          <div className="mb-10">
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        )}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FindRealtor;