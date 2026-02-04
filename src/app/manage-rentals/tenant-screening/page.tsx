import type { Metadata } from "next";
import {
  TenantScreeningBanner,
  TenantScreeningContent,
} from "@/components/ManageRentals/TenantScreening";

export const metadata: Metadata = {
  title: "Tenant Screening | Online Renter Background & Credit Checks | Summitly",
  description:
    "Run complete renter background checks, credit checks, and view eviction history. Free for landlords. No hidden fees. Secure and compliant tenant screening.",
  openGraph: {
    title: "Tenant Screening | Summitly Rental Manager",
    description:
      "Screen tenants with credit and background checks. Free for landlords, secure and compliant.",
  },
};

export default function TenantScreeningPage() {
  return (
    <div className="min-h-screen bg-white">
      <TenantScreeningBanner />
      <TenantScreeningContent />
    </div>
  );
}
