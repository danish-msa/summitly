"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Home, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Step = 1 | 2; // 1 = form, 2 = success

export interface VerifyHomeownerModalSubmitPayload {
  deedName: string;
  agreedToTerms: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface VerifyHomeownerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressLine?: string;
  /** Return false (or throw) to indicate failure and keep user on form; otherwise success and move to step 2 */
  onSubmit?: (payload: VerifyHomeownerModalSubmitPayload) => void | Promise<void | boolean>;
  onContinue?: () => void;
}

function isValidEmail(email: string) {
  // Simple and strict-enough for UI gating
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function VerifyHomeownerModal({
  open,
  onOpenChange,
  addressLine,
  onSubmit,
  onContinue,
}: VerifyHomeownerModalProps) {
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    }
  }, [open]);

  const canVerify = useMemo(() => {
    return (
      Boolean(firstName.trim()) &&
      Boolean(lastName.trim()) &&
      isValidEmail(email)
    );
  }, [firstName, lastName, email]);

  const headerAddress = addressLine || "Address not available";

  const handleBack = () => {
    onOpenChange(false);
  };

  const handleVerify = async () => {
    if (!canVerify) return;
    const result = await onSubmit?.({
      deedName: "",
      agreedToTerms: false,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    if (result !== false) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[90vh] p-0 overflow-hidden bg-white flex flex-col [&>button[class*='absolute']]:hidden">
        {step === 2 ? (
          <div className="relative flex flex-col items-center text-center p-8 sm:p-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-9 w-9 text-gray-500 hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verification Successful!
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mb-8">
              Congratulations! You&apos;ve successfully verified your ownership of the property. Now let&apos;s review your home details.
            </p>

            <Button
              type="button"
              onClick={() => {
                onContinue?.();
                onOpenChange(false);
              }}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full py-7 text-base font-semibold"
            >
              Continue to Home Details
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-sky-500 text-white px-6 py-5 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" aria-hidden="true" />
                    <div className="text-sm font-semibold tracking-wide uppercase">
                      I AM THE HOMEOWNER
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-white/90 truncate">{headerAddress}</div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12 rounded-2xl border border-gray-200 px-4 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="h-12 rounded-2xl border border-gray-200 px-4 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-2xl border border-gray-200 px-4 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number (optional)"
                    className="h-12 rounded-2xl border border-gray-200 px-4 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-5 flex items-center justify-between gap-4">
              <Button type="button" variant="ghost" onClick={handleBack} className="px-6">
                Back
              </Button>

              <Button
                type="button"
                onClick={handleVerify}
                disabled={!canVerify}
                className="px-10 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
              >
                Verify
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

