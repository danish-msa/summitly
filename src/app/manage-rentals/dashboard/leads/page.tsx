import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Leads | Rentals Dashboard",
  description: "Manage your rental leads and applications.",
};

export default function RentalsLeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Leads</h2>
        <p className="text-muted-foreground">Manage your rental leads and applications.</p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Leads list will be built here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
