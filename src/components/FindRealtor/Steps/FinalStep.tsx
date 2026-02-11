"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useSession } from "next-auth/react";
import { CheckCircle } from "lucide-react";
import { FormData } from "../types";
import AuthModal from "@/components/Auth/AuthModal";

interface FinalStepProps {
  formData: FormData;
  handleLogin: () => void;
  handleSignUp: () => void;
  itemVariants: Variants;
  containerVariants: Variants;
}

const FinalStep: React.FC<FinalStepProps> = ({
  containerVariants,
  itemVariants,
}) => {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const isLoggedIn = !!session?.user;

  if (status === "loading") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-2xl mx-auto text-center"
      >
        <div className="h-8 w-48 mx-auto mb-4 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-full max-w-md mx-auto rounded bg-gray-100 animate-pulse" />
      </motion.div>
    );
  }

  if (isLoggedIn) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-2xl mx-auto text-center"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-6"
          aria-hidden
        >
          <CheckCircle
            className="w-16 h-16 text-primary"
            strokeWidth={1.5}
          />
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-bold mb-6 text-gray-800"
        >
          Thanks! We&apos;ll get back to you soon
        </motion.h2>
        <motion.p variants={itemVariants} className="mb-6 text-gray-600">
          We&apos;ve received your preferences and will match you with the right
          realtor. Our team will reach out within 1–2 business days.
        </motion.p>
        <motion.p variants={itemVariants} className="mb-4 text-sm text-gray-500">
          In the meantime,{" "}
          <Link
            href="/buy"
            className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            browse properties for sale
          </Link>
          ,{" "}
          <Link
            href="/rent"
            className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            view rentals
          </Link>
          , or update your profile in your{" "}
          <Link
            href="/dashboard"
            className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            dashboard
          </Link>
          .
        </motion.p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-2xl mx-auto text-center"
      >
        <motion.h2
          variants={itemVariants}
          className="text-2xl mb-6 text-gray-800"
        >
          Great! We&apos;re ready to connect you with a realtor
        </motion.h2>
        <motion.p variants={itemVariants} className="mb-8 text-gray-600">
          To see your matched realtors, please log in or create an account.
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button
            onClick={handleLoginClick}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
          >
            Log In
          </button>
        </motion.div>
      </motion.div>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default FinalStep;
