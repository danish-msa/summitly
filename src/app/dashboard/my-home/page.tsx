"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bed, Bath, Square, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserHome = {
  id: string;
  slug: string;
  addressLine: string;
  streetNumber?: string | null;
  streetName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  bedrooms?: number | null;
  fullBathrooms?: number | null;
  partialBathrooms?: number | null;
  livingAreaSqft?: number | null;
  yearBuilt?: number | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
};

const PLACEHOLDER_IMAGE = "/images/p1.jpg";

function formatBathrooms(full?: number | null, partial?: number | null): string {
  const fullNum = full ?? 0;
  const partialNum = partial ?? 0;
  const total = fullNum + partialNum;
  if (total === 0) return "—";
  return total % 1 === 0 ? String(total) : total.toFixed(1);
}

function formatSavedDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Saved today";
  if (diffDays === 1) return "Saved yesterday";
  if (diffDays < 7) return `Saved ${diffDays} days ago`;
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `Saved ${dateStr}`;
}

export default function MyHomeDashboardPage() {
  const { data: session } = useSession();
  const [homes, setHomes] = useState<UserHome[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!session) return;
      const isInitialLoad = homes.length === 0;
      if (isInitialLoad) setLoading(true);
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
              <Card key={home.id} className="shadow-md overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-32 h-36 sm:h-auto sm:min-h-[128px] shrink-0 bg-muted">
                    <Image
                      src={PLACEHOLDER_IMAGE}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 128px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                        <span className="truncate">{home.addressLine}</span>
                        {home.verifiedAt ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full shrink-0">
                            Unverified
                          </span>
                        )}
                      </CardTitle>
                      {[home.city, home.state, home.zip].filter(Boolean).length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {[home.city, home.state, home.zip].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5" aria-label="Bedrooms">
                          <Bed className="h-4 w-4 shrink-0" aria-hidden />
                          {home.bedrooms ?? "—"} bed
                        </span>
                        <span className="inline-flex items-center gap-1.5" aria-label="Bathrooms">
                          <Bath className="h-4 w-4 shrink-0" aria-hidden />
                          {formatBathrooms(home.fullBathrooms, home.partialBathrooms)} bath
                        </span>
                        <span className="inline-flex items-center gap-1.5" aria-label="Square footage">
                          <Square className="h-4 w-4 shrink-0" aria-hidden />
                          {home.livingAreaSqft != null ? `${home.livingAreaSqft.toLocaleString()} sq ft` : "—"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground" title={new Date(home.createdAt).toLocaleString()}>
                          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                          {formatSavedDate(home.createdAt)}
                        </span>
                      </div>
                      <Button asChild variant="default" size="sm" className="rounded-xl shrink-0 w-full sm:w-auto">
                        <Link href={`/dashboard/my-home/${encodeURIComponent(home.slug)}`}>
                          View details
                        </Link>
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

