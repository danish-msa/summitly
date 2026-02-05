import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Users, MessageSquare, CreditCard, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Rentals Dashboard | Manage Your Properties",
  description: "Manage your rental properties, leads, messages, and payments.",
};

const quickLinks = [
  { title: "Properties", href: "/manage-rentals/dashboard/properties", icon: Building2 },
  { title: "Add a property", href: "/manage-rentals/dashboard/properties/new", icon: Plus },
  { title: "Leads", href: "/manage-rentals/dashboard/leads", icon: Users },
  { title: "Messages", href: "/manage-rentals/dashboard/messages", icon: MessageSquare },
  { title: "Payments", href: "/manage-rentals/dashboard/payments", icon: CreditCard },
  { title: "Alerts", href: "/manage-rentals/dashboard/alerts", icon: Bell },
];

export default function RentalsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Rentals Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your rental properties, leads, messages, and payments.
        </p>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="font-medium">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
