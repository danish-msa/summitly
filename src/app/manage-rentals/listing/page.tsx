import type { Metadata } from "next";
import {
  ListingBanner,
  ListingContent,
} from "@/components/ManageRentals/Listing";

export const metadata: Metadata = {
  title: "List Your Rental Property for Free | Summitly",
  description:
    "List your rental for free on the network with over 1 million daily visitors. Create listings, message renters, and screen tenants with Summitly Rental Manager.",
  openGraph: {
    title: "List Your Rental Property for Free | Summitly",
    description:
      "List your rental for free. Create listings, message renters, and screen tenants with Summitly Rental Manager.",
  },
};

export default function ListingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ListingBanner />
      <ListingContent />
    </div>
  );
}
