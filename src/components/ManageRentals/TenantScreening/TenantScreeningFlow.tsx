"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Building2, UserPlus, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const FLOW_STORAGE_KEY = "tenant-screening-flow";

const SECTIONS = [
  { id: "whos-screening", label: "Who's screening?" },
  { id: "property-address", label: "Property address" },
  { id: "send-application", label: "Send application" },
] as const;

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Townhouse", "Duplex", "Studio", "Other"];

export function TenantScreeningFlow() {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([
    "whos-screening",
    "property-address",
    "send-application",
  ]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const [screeningFirstName, setScreeningFirstName] = useState("");
  const [screeningLastName, setScreeningLastName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantFirstName, setApplicantFirstName] = useState("");
  const [applicantLastName, setApplicantLastName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState({ screening: false, property: false, email: false });

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector("[data-sidebar], .sidebar, [class*=\"sidebar\"]") as HTMLElement;
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      } else {
        const mainContainer = document.querySelector("main")?.parentElement;
        if (mainContainer) {
          const sidebarElement = mainContainer.querySelector("[class*=\"w-\"]") as HTMLElement;
          if (sidebarElement && sidebarElement !== mainContainer.querySelector("main")?.parentElement) {
            setSidebarWidth(sidebarElement.offsetWidth);
          }
        }
      }
    };
    updateSidebarWidth();
    window.addEventListener("resize", updateSidebarWidth);
    const interval = setInterval(updateSidebarWidth, 200);
    return () => {
      window.removeEventListener("resize", updateSidebarWidth);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(FLOW_STORAGE_KEY) : null;
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>;
        if (data.screeningContactFirstName) setScreeningFirstName(data.screeningContactFirstName);
        if (data.screeningContactLastName) setScreeningLastName(data.screeningContactLastName);
        if (data.propertyType) setPropertyType(data.propertyType);
        if (data.streetAddress) setStreetAddress(data.streetAddress);
      }
    } catch {
      // ignore
    }
  }, []);

  const navigateToSection = (section: string) => {
    if (!openSections.includes(section)) {
      setOpenSections((prev) => [...prev, section]);
    }
    setTimeout(() => {
      const el = sectionRefs.current[section];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const persistFlow = (overrides: Record<string, string>) => {
    try {
      const existing = typeof window !== "undefined" ? sessionStorage.getItem(FLOW_STORAGE_KEY) : null;
      const data = existing ? { ...JSON.parse(existing) } : {};
      sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ ...data, ...overrides }));
    } catch {
      // ignore
    }
  };

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const canContinueScreening = screeningFirstName.trim() && screeningLastName.trim();
  const canContinueProperty = streetAddress.trim();
  const canSend =
    applicantEmail.trim() &&
    validateEmail(applicantEmail.trim()) &&
    applicantFirstName.trim() &&
    applicantLastName.trim();

  const handleContinueScreening = () => {
    setTouched((t) => ({ ...t, screening: true }));
    if (!canContinueScreening) return;
    persistFlow({
      screeningContactFirstName: screeningFirstName.trim(),
      screeningContactLastName: screeningLastName.trim(),
    });
    navigateToSection("property-address");
  };

  const handleContinueProperty = () => {
    setTouched((t) => ({ ...t, property: true }));
    if (!canContinueProperty) return;
    persistFlow({ propertyType, streetAddress: streetAddress.trim() });
    navigateToSection("send-application");
  };

  const handleSend = () => {
    setTouched((t) => ({ ...t, email: true }));
    if (!applicantEmail.trim()) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!validateEmail(applicantEmail.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    try {
      sessionStorage.removeItem(FLOW_STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push("/manage-rentals/dashboard/applications");
  };

  const handleSaveExit = () => {
    persistFlow({
      screeningContactFirstName: screeningFirstName.trim(),
      screeningContactLastName: screeningLastName.trim(),
      propertyType,
      streetAddress: streetAddress.trim(),
    });
    router.push("/manage-rentals/dashboard/applications");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#F8FAFC] rounded-2xl relative mt-20 pb-24">
      {/* Fixed section nav - same pattern as ListingFlow */}
      <div
        className="fixed z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm"
        style={{ top: "64px", left: `${sidebarWidth}px`, right: "0px" }}
      >
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {SECTIONS.map((section) => (
              <Button
                key={section.id}
                type="button"
                variant={openSections.includes(section.id) ? "default" : "outline"}
                onClick={() => navigateToSection(section.id)}
                className="rounded-lg"
              >
                {section.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4 px-4 pt-4"
      >
        {/* Who's screening? */}
        <div ref={(el) => { sectionRefs.current["whos-screening"] = el }}>
          <AccordionItem value="whos-screening">
            <AccordionTrigger className="max-w-7xl mx-auto w-full text-lg font-semibold px-6 rounded-lg">
              Who&apos;s screening?
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 max-w-7xl mx-auto w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" aria-hidden />
                      Who&apos;s screening applicants?
                    </CardTitle>
                    <CardDescription>
                      Enter the property manager or primary contact for applicants who receive an application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="screening-first-name">
                          First name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="screening-first-name"
                          value={screeningFirstName}
                          onChange={(e) => setScreeningFirstName(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, screening: true }))}
                          placeholder="First name"
                          className={cn(
                            "h-11",
                            touched.screening && !screeningFirstName.trim() &&
                              "border-destructive focus-visible:ring-destructive"
                          )}
                          aria-invalid={touched.screening && !screeningFirstName.trim()}
                        />
                        {touched.screening && !screeningFirstName.trim() && (
                          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                            Enter first name
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="screening-last-name">
                          Last name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="screening-last-name"
                          value={screeningLastName}
                          onChange={(e) => setScreeningLastName(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, screening: true }))}
                          placeholder="Last name"
                          className={cn(
                            "h-11",
                            touched.screening && !screeningLastName.trim() &&
                              "border-destructive focus-visible:ring-destructive"
                          )}
                          aria-invalid={touched.screening && !screeningLastName.trim()}
                        />
                        {touched.screening && !screeningLastName.trim() && (
                          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                            Enter last name
                          </p>
                        )}
                      </div>
                    </div>
                    <Button type="button" onClick={handleContinueScreening} className="rounded-xl">
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Property address */}
        <div ref={(el) => { sectionRefs.current["property-address"] = el }}>
          <AccordionItem value="property-address">
            <AccordionTrigger className="max-w-7xl mx-auto w-full text-lg font-semibold px-6 rounded-lg">
              Property address
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 max-w-7xl mx-auto w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" aria-hidden />
                      What&apos;s your property&apos;s address?
                    </CardTitle>
                    <CardDescription>
                      Add the details for the property where you&apos;re screening applications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="property-type">Property type</Label>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger id="property-type" className="h-11">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street-address">
                        Street address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="street-address"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, property: true }))}
                        placeholder="Enter street address"
                        className={cn(
                          "h-11",
                          touched.property && !streetAddress.trim() &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                        required
                        aria-invalid={touched.property && !streetAddress.trim()}
                      />
                      <p className="text-sm text-muted-foreground">Enter a USPS-validated address.</p>
                      {touched.property && !streetAddress.trim() && (
                        <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Enter street address
                        </p>
                      )}
                    </div>
                    <Button type="button" onClick={handleContinueProperty} className="rounded-xl">
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Send application */}
        <div ref={(el) => { sectionRefs.current["send-application"] = el }}>
          <AccordionItem value="send-application">
            <AccordionTrigger className="max-w-7xl mx-auto w-full text-lg font-semibold px-6 rounded-lg">
              Send application
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 max-w-7xl mx-auto w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" aria-hidden />
                      Send an application request
                    </CardTitle>
                    <CardDescription>
                      Enter the information of the primary applicant you&apos;d like to screen. You only need to send one application per group of renters; the applicant can add co-applicants.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicant-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="applicant-email"
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => {
                          setApplicantEmail(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        placeholder="Applicant email"
                        className={cn(
                          "h-11",
                          (emailError || (touched.email && !validateEmail(applicantEmail.trim()))) &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                        aria-invalid={!!emailError || (touched.email && !validateEmail(applicantEmail.trim()))}
                        aria-describedby={emailError ? "email-error" : undefined}
                      />
                      {(emailError || (touched.email && applicantEmail.trim() && !validateEmail(applicantEmail.trim()))) && (
                        <p id="email-error" className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          {emailError || "Please enter a valid email address"}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="applicant-first-name">First name</Label>
                        <Input
                          id="applicant-first-name"
                          value={applicantFirstName}
                          onChange={(e) => setApplicantFirstName(e.target.value)}
                          placeholder="First name"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="applicant-last-name">Last name</Label>
                        <Input
                          id="applicant-last-name"
                          value={applicantLastName}
                          onChange={(e) => setApplicantLastName(e.target.value)}
                          placeholder="Last name"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={handleSend} className="rounded-xl gap-2">
                      Send
                      <Send className="h-4 w-4" aria-hidden />
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      By enabling or sharing applications, you agree to comply with our{" "}
                      <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>,{" "}
                      <Link href="/terms" className="text-primary hover:underline">Rental User Terms</Link>, and{" "}
                      <Link href="/terms" className="text-primary hover:underline">Respectful Renting Pledge</Link>.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>
      </Accordion>

      <div className="h-24" />

      {/* Fixed footer - same pattern as ListingFlow */}
      <div
        className="fixed bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg"
        style={{ left: `${sidebarWidth}px`, right: "0px" }}
      >
        <div className="px-6 py-4">
          <div className="flex justify-between gap-4 max-w-7xl mx-auto items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveExit}
              className="min-w-[120px] rounded-xl"
            >
              Save &amp; exit
            </Button>
            <Button
              type="button"
              onClick={() => navigateToSection("send-application")}
              variant="secondary"
              className="min-w-[120px] rounded-xl"
            >
              Go to Send application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
