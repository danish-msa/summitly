"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AddressAutocompleteInput } from "../../PriceMyRental/AddressAutocompleteInput";

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "townhome", label: "Townhome" },
  { value: "condo", label: "Condo" },
  { value: "apartment", label: "Apartment" },
  { value: "room", label: "Room" },
];

const ListingBanner: React.FC = () => {
  const [streetAddress, setStreetAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [sharedLivingSpace, setSharedLivingSpace] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to listing flow
  };

  return (
    <section
      className="relative min-h-[420px] sm:min-h-[520px] flex items-center justify-center"
      aria-labelledby="listing-banner-heading"
    >
      {/* Background image with blur */}
      <div className="absolute inset-0">
        <Image
          src="/images/managerentals/listing-banner.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 w-full container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
            <h1
              id="listing-banner-heading"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 leading-tight mb-2 text-center"
            >
              List your rental property for free — it&apos;s{" "}
              <span className="text-secondary">quick</span> and{" "}
              <span className="text-secondary">easy</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 text-center mb-6">
              Fill your vacancy on the network with over 1 million daily
              visitors. Post your rental today.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AddressAutocompleteInput
                value={streetAddress}
                onSelect={setStreetAddress}
                name="streetAddress"
              />
              <div>
                <label
                  htmlFor="property-type-select"
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                >
                  Property type
                </label>
                <Select
                  value={propertyType}
                  onValueChange={setPropertyType}
                  name="propertyType"
                >
                  <SelectTrigger
                    id="property-type-select"
                    aria-label="Property type"
                  >
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <label
                  htmlFor="shared-living-space"
                  className="text-sm font-medium text-zinc-900 cursor-pointer flex-1"
                >
                  This is a room for rent with shared living space
                </label>
                <Switch
                  id="shared-living-space"
                  checked={sharedLivingSpace}
                  onCheckedChange={setSharedLivingSpace}
                  aria-label="This is a room for rent with shared living space"
                  className="data-[state=checked]:bg-secondary shrink-0"
                />
              </div>
              <input
                type="hidden"
                name="sharedLivingSpace"
                value={sharedLivingSpace ? "true" : "false"}
                readOnly
                aria-hidden
              />
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="rounded-xl w-full"
              >
                Get started
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden />
              </Button>
            </form>

            <p className="text-sm text-zinc-600 text-center mt-5">
              Already have an account?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-secondary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingBanner;
