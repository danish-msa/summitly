import type { Metadata } from "next";
import {
  RentalLeaseAgreementsBanner,
  RentalLeaseAgreementsContent,
} from "@/components/ManageRentals/RentalLeaseAgreements";

export const metadata: Metadata = {
  title: "Rental Lease Agreements | Create & Sign Leases Online | Summitly",
  description:
    "Upload and edit your lease agreement or build a new rental lease. E-sign electronically. Free to create, legally reviewed. Manage leases online with Summitly.",
  openGraph: {
    title: "Rental Lease Agreements | Summitly",
    description:
      "Create, customize, and sign rental lease agreements online. E-signatures, legally reviewed. Free for landlords.",
  },
};

export default function RentalLeaseAgreementsPage() {
  return (
    <div className="min-h-screen bg-white">
      <RentalLeaseAgreementsBanner />
      <RentalLeaseAgreementsContent />
    </div>
  );
}
