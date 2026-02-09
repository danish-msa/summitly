import { redirect } from "next/navigation";

export default function TenantScreeningSendRedirect() {
  redirect("/manage-rentals/dashboard/applications/tenant-screening");
}
