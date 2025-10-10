"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FindRealtor from '@/components/Home/FindRealtor/FindRealtor';

// Create a client component that uses useSearchParams
const FindRealtorWithParams = () => {
  const searchParams = useSearchParams();
  const userFlow = searchParams?.get('userFlow');
  
  // Type assertion to ensure userFlow is one of the expected values
  const validUserFlow = ['buyer', 'seller', 'both'].includes(userFlow as string) 
    ? userFlow as 'buyer' | 'seller' | 'both' 
    : null;
  
  return <FindRealtor initialUserType={validUserFlow} />;
};

// Main page component with Suspense boundary
const FindAnAgentPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <FindRealtorWithParams />
    </Suspense>
  );
};

export default FindAnAgentPage;