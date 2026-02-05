import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Payments | Rentals Dashboard",
  description: "Manage rental payments and transactions.",
};

export default function RentalsPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Payments</h2>
        <p className="text-muted-foreground">Manage rental payments and transactions.</p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Payments will be built here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
