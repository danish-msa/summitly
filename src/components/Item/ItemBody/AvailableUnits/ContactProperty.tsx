import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare } from "lucide-react";

export function ContactProperty() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Contact Property</h3>
      
      <div className="space-y-4 bg-primary/10 p-6 rounded-lg border border-primary/20">
        <div className="space-y-2">
          <p className="font-medium">Luxury Residences Management</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>(555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>leasing@luxuryresidences.com</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button className="w-full gap-2">
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
        </div>
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p className="font-medium mb-1">Office Hours</p>
          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
          <p>Saturday: 10:00 AM - 4:00 PM</p>
          <p>Sunday: Closed</p>
        </div>
      </div>
    </div>
  );
}

