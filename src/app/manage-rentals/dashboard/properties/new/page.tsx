"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddPropertyDialog } from "@/components/ManageRentals/AddProperty/AddPropertyDialog";
import type { AddPropertyInitialData } from "@/components/ManageRentals/AddProperty/AddPropertyDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AddPropertyPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setDialogOpen(true);
  }, []);

  const handleSubmit = (data: AddPropertyInitialData) => {
    try {
      sessionStorage.setItem("add-property-initial", JSON.stringify(data));
    } catch {
      // ignore
    }
    router.push("/manage-rentals/dashboard/properties/new/listing");
  };

  return (
    <>
      <AddPropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      {!dialogOpen && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Add a property</h2>
            <p className="text-muted-foreground">
              Add a new rental property to your portfolio.
            </p>
          </div>
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Add your property to get started.
              </p>
              <Button onClick={() => setDialogOpen(true)}>Add property</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
