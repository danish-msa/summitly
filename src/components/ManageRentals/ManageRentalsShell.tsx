"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RentalsNavbar } from "@/components/ManageRentals/RentalsNavbar";

export function ManageRentalsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/manage-rentals/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-[100] h-10 flex items-center border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            ← Summitly Home
          </Link>
        </div>
      </div>
      <RentalsNavbar />
      <main style={{ paddingTop: "6.5rem" }}>{children}</main>
    </div>
  );
}
