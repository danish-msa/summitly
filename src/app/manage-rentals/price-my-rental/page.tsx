import type { Metadata } from "next";
import {
  PriceMyRentalBanner,
  PricingSection,
} from "@/components/ManageRentals/PriceMyRental";

export const metadata: Metadata = {
  title: "Price My Rental | Get a Free Rent Zestimate® | Summitly",
  description:
    "Get a free Rent Zestimate® for your rental. Use market data and local trends to set the right rent. Start with your address.",
  openGraph: {
    title: "Price My Rental | Get a Free Rent Zestimate® | Summitly",
    description:
      "Get a free Rent Zestimate® for your rental. Use market data and local trends to set the right rent.",
  },
};

export default function PriceMyRentalPage() {
  return (
    <div className="min-h-screen bg-white">
      <PriceMyRentalBanner />
      <PricingSection />
    </div>
  );
}
