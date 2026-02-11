import type { Metadata } from "next";
import {
  ManageRentalsBanner,
  RentLikeAPro,
  GuessworkSection,
  ManageRentalsTestimonials,
} from "@/components/ManageRentals";

export const metadata: Metadata = {
  title: "Rental Manager | Manage Rentals Simply & Confidently",
  description:
    "Level up your landlording with Rental Manager. Leases, payments, maintenance, and screening—all in one place. Get started for free.",
  openGraph: {
    title: "Rental Manager | Manage Rentals Simply & Confidently",
    description:
      "Level up your landlording with Rental Manager. Leases, payments, maintenance, and screening—all in one place.",
  },
};

export default function ManageRentalsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ManageRentalsBanner />
      <RentLikeAPro />
      <GuessworkSection />
      <ManageRentalsTestimonials />
    </div>
  );
}
