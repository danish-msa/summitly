"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserHome = {
  id: string;
  slug: string;
  addressLine: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  updatedAt: string;
  verifiedAt?: string | null;
};

export default function MyHomeDashboardPage() {
  const { data: session } = useSession();
  const [homes, setHomes] = useState<UserHome[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const res = await fetch("/api/v1/my-home");
        if (!res.ok) return;
        const json = await res.json();
        setHomes(json.homes || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">My Home</h2>
        <p className="text-muted-foreground">
          Your saved and verified properties.
        </p>
      </div>

      {!session ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Log in to view your saved homes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loading ? (
            <Card className="shadow-md">
              <CardContent className="py-10 text-sm text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : homes.length === 0 ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>No homes saved yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Verify a home from the homeowner page to see it here.
              </CardContent>
            </Card>
          ) : (
            homes.map((home) => (
              <Card key={home.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="truncate">{home.addressLine}</span>
                    {home.verifiedAt ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                        Unverified
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {[home.city, home.state, home.zip].filter(Boolean).join(", ")}
                  </div>
                  <Link
                    href={`/homeowner/${home.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

