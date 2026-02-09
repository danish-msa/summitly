import { redirect } from "next/navigation";

export default function TenantScreeningPropertyRedirect() {
  redirect("/manage-rentals/dashboard/applications/tenant-screening");
}
