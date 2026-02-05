import { RentalsDashboardLayout } from "@/components/Dashboard/RentalsDashboardLayout";

export default function ManageRentalsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RentalsDashboardLayout>{children}</RentalsDashboardLayout>;
}
