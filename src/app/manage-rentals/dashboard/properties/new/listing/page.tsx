"use client";

import { useState, useEffect } from "react";
import { ListingFlow } from "@/components/ManageRentals/AddProperty/ListingFlow";
import type { AddPropertyInitialData } from "@/components/ManageRentals/AddProperty/AddPropertyDialog";

export default function ListingFlowPage() {
  const [initialData, setInitialData] = useState<AddPropertyInitialData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("add-property-initial");
      if (raw) {
        const data = JSON.parse(raw) as AddPropertyInitialData;
        setInitialData(data);
        sessionStorage.removeItem("add-property-initial");
      }
    } catch {
      // ignore
    }
  }, []);

  return <ListingFlow initialData={initialData} />;
}
