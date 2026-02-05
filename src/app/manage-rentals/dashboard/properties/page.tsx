import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Properties | Rentals Dashboard",
  description: "View and manage your rental properties.",
};

export default function RentalsPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Properties</h2>
        <p className="text-muted-foreground">View and manage your rental properties.</p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Properties list will be built here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
