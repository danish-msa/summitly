import React from "react";
import { ManageRentalsShell } from "@/components/ManageRentals/ManageRentalsShell";

export default function ManageRentalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManageRentalsShell>{children}</ManageRentalsShell>;
}
