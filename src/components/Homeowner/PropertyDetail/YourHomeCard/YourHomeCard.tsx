"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VerifyHomeownerModal from './VerifyHomeownerModal';
import AuthModal from '@/components/Auth/AuthModal';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

interface YourHomeCardProps {
  onVerify?: () => void;
  /** When true, shows the verified success state instead of the verify CTA */
  isVerified?: boolean;
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
  isVerified: isVerifiedProp = false,
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
  const [verifiedLocally, setVerifiedLocally] = useState(false);
  const [verifiedFromApi, setVerifiedFromApi] = useState<boolean | null>(null);

  const isVerified = isVerifiedProp || verifiedLocally || verifiedFromApi === true;

  // Check if this property is already in the user's saved (verified) homes
  React.useEffect(() => {
    if (!session?.user?.id || !propertySlug?.trim()) {
      setVerifiedFromApi(null);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/v1/my-home", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const homes = json.homes ?? [];
        const match = homes.some(
          (h: { slug?: string }) => (h.slug || "").trim() === (propertySlug || "").trim()
        );
        if (!cancelled) setVerifiedFromApi(match);
      } catch {
        if (!cancelled) setVerifiedFromApi(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, propertySlug]);

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
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 text-white text-sm rounded-md font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                Verified
              </span>
            )}
            {!isVerified && (
              <button className="px-3 py-1 bg-white/20 border border-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors">
                Estimated equity
              </button>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center ${isVerified ? 'bg-emerald-500/30 border border-white/30' : 'bg-white/20'}`}>
                {isVerified ? (
                  <CheckCircle2 className="w-6 h-6 text-white" aria-hidden />
                ) : (
                  <Lock className="w-6 h-6 text-white" aria-hidden />
                )}
              </div>
            </div>

            <div className="flex-1">
              {isVerified ? (
                <>
                  <p className="text-white font-semibold mb-2">
                    This home is verified.
                  </p>
                  <p className="text-white/90 text-sm mb-4">
                    You have full access to equity estimates, market insights, and tools. View or update your saved home anytime in your dashboard.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white font-semibold mb-2">
                    Verify ownership to unlock all features for free.
                  </p>
                  <p className="text-white/90 text-sm mb-4">
                    Did you know you can quickly access cash by tapping into your home equity? Claim your property now to see how much equity you have.
                  </p>
                </>
              )}
            </div>

            <div className="flex-shrink-0">
              {isVerified ? (
                <Button
                  asChild
                  variant="secondary"
                  className="bg-white/90 text-secondary hover:bg-white font-semibold px-6 py-2 rounded-lg shadow-md border-0"
                >
                  <Link href="/dashboard/my-home">View in Dashboard</Link>
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>

      <VerifyHomeownerModal
        open={isVerifyOpen}
        onOpenChange={setIsVerifyOpen}
        addressLine={addressLine}
        onSubmit={async (payload) => {
          if (!propertySlug) return false;

          const res = await fetch("/api/v1/my-home", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
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
              // Do not send Repliers listing details here — dashboard should show the user's own info.
              // User can add/edit details via "Edit home details" and that will be saved to the dashboard.
              details: {},
              verification: {
                deedName: payload.deedName,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
              },
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to save" }));
            toast({
              title: "Could not save home",
              description: err?.error ?? "Please try again.",
              variant: "destructive",
            });
            return false;
          }

          setVerifiedLocally(true);
          toast({
            title: "Home verified",
            description: "Your property is saved. View it anytime under Dashboard → My Home.",
          });
        }}
        onContinue={() => {
          setVerifiedLocally(true);
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
