import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Messages | Rentals Dashboard",
  description: "View and manage your rental messages.",
};

export default function RentalsMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">View and manage your rental messages.</p>
      </div>
      <Card className="shadow-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Messages will be built here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
