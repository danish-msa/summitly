"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import FindRealtorHero from "./Hero/Hero";
import AgentMatchingInfo from "./AgentMatchingInfo/AgentMatchingInfo";
import UserTypeStep from "./Steps/UserTypeStep";
import LocationStep from "./Steps/LocationStep";
import PropertyTypeStep from "./Steps/PropertyTypeStep";
import BudgetStep from "./Steps/BudgetStep";
import MortgageStep from "./Steps/MortgageStep";
import FinalStep from "./Steps/FinalStep";

import { UserType, Step, FormData } from "./types";

interface FindRealtorProps {
  initialUserType: "buyer" | "seller" | "both" | null;
}

const FindRealtor: React.FC<FindRealtorProps> = ({ initialUserType }) => {
  const router = useRouter();
  const [formModalOpen, setFormModalOpen] = useState(!!initialUserType);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [currentStep, setCurrentStep] = useState<Step>(initialUserType ? "location" : "userType");
  const [formData, setFormData] = useState<FormData>({
    location: "",
    propertyType: "",
    budget: "",
    priceRange: { min: 300000, max: 1000000 },
    mortgage: false,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setCurrentStep("location");
  };

  const handleHeroUserTypeSelect = (type: "buyer" | "seller" | "both") => {
    setUserType(type);
    setCurrentStep("location");
    setFormModalOpen(true);
  };

  const handleLocationSelect = (locationName: string) => {
    setFormData((prev) => ({ ...prev, location: locationName }));
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case "userType":
        setCurrentStep("location");
        break;
      case "location":
        setCurrentStep("propertyType");
        break;
      case "propertyType":
        setCurrentStep("budget");
        break;
      case "budget":
        setCurrentStep("mortgage");
        break;
      case "mortgage":
        setCurrentStep("final");
        break;
      default:
        break;
    }
  };

  const handlePrevStep = () => {
    switch (currentStep) {
      case "location":
        setFormModalOpen(false);
        return;
      case "propertyType":
        setCurrentStep("location");
        break;
      case "budget":
        setCurrentStep("propertyType");
        break;
      case "mortgage":
        setCurrentStep("budget");
        break;
      case "final":
        setCurrentStep("mortgage");
        break;
      default:
        break;
    }
  };

  const handleLogin = () => router.push("/login");
  const handleSignUp = () => router.push("/signup");

  const renderStep = () => {
    switch (currentStep) {
      case "userType":
        return (
          <UserTypeStep
            handleUserTypeSelect={handleUserTypeSelect}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case "location":
        return (
          <LocationStep
            userType={userType}
            formData={formData}
            onLocationSelect={handleLocationSelect}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            itemVariants={itemVariants}
            containerVariants={containerVariants}
          />
        );
      case "propertyType":
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
      case "budget":
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
      case "mortgage":
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
      case "final":
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

  const steps: Step[] = ["userType", "location", "propertyType", "budget", "mortgage", "final"];
  const currentIndex = steps.indexOf(currentStep);
  const progress = (currentIndex / (steps.length - 1)) * 100;

  const handleModalOpenChange = (open: boolean) => {
    setFormModalOpen(open);
    if (!open) setCurrentStep("location");
  };

  return (
    <div className="bg-white">
      <FindRealtorHero onUserTypeSelect={handleHeroUserTypeSelect} />
      <AgentMatchingInfo />
      <Dialog open={formModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 gap-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            Find a Realtor – tell us your preferences
          </DialogTitle>
          <div className="p-6 pb-8">
            <div className="mb-6">
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindRealtor;
