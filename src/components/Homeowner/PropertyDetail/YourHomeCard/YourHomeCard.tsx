"use client";

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VerifyHomeownerModal from './VerifyHomeownerModal';
import AuthModal from '@/components/Auth/AuthModal';
import { useSession } from 'next-auth/react';

interface YourHomeCardProps {
  onVerify?: () => void;
  addressLine?: string;
  propertySlug?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  lotSize?: string;
  garage?: number | string;
  yearBuilt?: number | string;
}

const YourHomeCard: React.FC<YourHomeCardProps> = ({
  onVerify,
  addressLine,
  propertySlug,
  streetNumber,
  streetName,
  city,
  state,
  zip,
  beds,
  baths,
  sqft,
  lotSize,
  garage,
  yearBuilt,
}) => {
  const { data: session } = useSession();
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingOpenVerify, setPendingOpenVerify] = useState(false);

  React.useEffect(() => {
    if (session && pendingOpenVerify) {
      setPendingOpenVerify(false);
      setIsAuthModalOpen(false);
      setIsVerifyOpen(true);
    }
  }, [session, pendingOpenVerify]);

  return (
    <>
      <div className="price-card-gradient rounded-xl shadow-sm p-10 mb-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          ></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <h3 className="text-xl font-bold text-white">Your Home</h3>
            <button className="px-3 py-1 bg-white/20 border border-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors">
              Estimated equity
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full shadow-sm flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-white font-semibold mb-2">
                Verify ownership to unlock all features for free.
              </p>
              <p className="text-white/90 text-sm mb-4">
                Did you know you can quickly access cash by tapping into your home equity? Claim your property now to see how much equity you have.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Button
                onClick={() => {
                  if (!session) {
                    setPendingOpenVerify(true);
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsVerifyOpen(true);
                }}
                className="bg-white text-secondary hover:bg-secondary/90 font-semibold px-6 py-2 rounded-lg shadow-md"
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      </div>

      <VerifyHomeownerModal
        open={isVerifyOpen}
        onOpenChange={setIsVerifyOpen}
        addressLine={addressLine}
        onSubmit={async (payload) => {
          if (!propertySlug) return;

          await fetch("/api/v1/my-home", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: propertySlug,
              addressLine: addressLine || "",
              address: {
                streetNumber,
                streetName,
                city,
                state,
                zip,
              },
              details: {
                bedrooms: beds,
                fullBathrooms: baths,
                livingAreaSqft: sqft,
                lotSize,
                garageType: garage,
                yearBuilt,
              },
              verification: {
                deedName: payload.deedName,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
              },
            }),
          });
        }}
        onContinue={() => {
          // Continue to home details after success screen
          onVerify?.();
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        redirectTo={false}
        onClose={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
};

export default YourHomeCard;
