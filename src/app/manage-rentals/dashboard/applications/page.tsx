import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, UserPlus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Applications | Rentals Dashboard",
  description: "Manage tenant applications and screening.",
};

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Applications</h2>
        <p className="text-muted-foreground">
          Invite applicants, send screening links, and manage tenant applications.
        </p>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" aria-hidden />
            Tenant screening
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start screening applicants by adding who will screen renters and the property details. Then send application links to prospective tenants.
          </p>
          <Button asChild className="rounded-xl gap-2">
            <Link href="/manage-rentals/dashboard/applications/tenant-screening">
              Start screening tenants
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          <UserPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" aria-hidden />
          <p>Application history and invited applicants will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
