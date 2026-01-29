"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Home, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent } from "@/components/ui/dialog";

type Step = 1 | 2 | 3;

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
  onSubmit?: (payload: VerifyHomeownerModalSubmitPayload) => void | Promise<void>;
  onContinue?: () => void;
}

const DEED_NAME_OPTIONS = [
  "Michael Mitchell",
  "Christina Nelson",
  "Erin Clark",
  "Brandon S Phillips",
  "Jeremy Robinson",
  "Sarah Davis",
  "David Wilson",
  "None of the above",
] as const;

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

  // Step 1
  const [deedName, setDeedName] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 2
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setDeedName("");
      setAgreedToTerms(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    }
  }, [open]);

  const canGoNext = useMemo(() => {
    return Boolean(deedName) && agreedToTerms;
  }, [deedName, agreedToTerms]);

  const canVerify = useMemo(() => {
    return (
      Boolean(firstName.trim()) &&
      Boolean(lastName.trim()) &&
      isValidEmail(email) &&
      canGoNext
    );
  }, [firstName, lastName, email, canGoNext]);

  const headerAddress = addressLine || "Address not available";

  const handleBack = () => {
    if (step === 1) {
      onOpenChange(false);
      return;
    }
    setStep(1);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setStep(2);
  };

  const handleVerify = async () => {
    if (!canVerify) return;
    await onSubmit?.({
      deedName,
      agreedToTerms,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    setStep(3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[90vh] p-0 overflow-hidden bg-white flex flex-col [&>button[class*='absolute']]:hidden">
        {step === 3 ? (
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
              {step === 1 ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Whose name is on your home's deed?
                  </h2>

                  <RadioGroup value={deedName} onValueChange={setDeedName} className="space-y-3">
                    {DEED_NAME_OPTIONS.map((name) => (
                      <label
                        key={name}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                          deedName === name ? "border-sky-500 bg-sky-50/40" : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <RadioGroupItem value={name} />
                        <span className="text-sm font-medium text-gray-900">{name}</span>
                      </label>
                    ))}
                  </RadioGroup>

                  <div className="mt-6 flex items-start gap-3">
                    <Checkbox
                      id="verify-terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="verify-terms"
                      className="text-xs leading-relaxed text-gray-500 cursor-pointer"
                    >
                      By claiming this home, I agree to ComeHome&apos;s{" "}
                      <Link href="/terms" className="text-sky-600 hover:underline">
                        Terms of Use
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-sky-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-sky-600" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-gray-600">
                      To verify that you are the homeowner, please tell us more about yourself.
                    </p>
                  </div>

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
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-5 flex items-center justify-between gap-4">
              <Button type="button" variant="ghost" onClick={handleBack} className="px-6">
                Back
              </Button>

              {step === 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="px-10 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={!canVerify}
                  className="px-10 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
                >
                  Verify
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

