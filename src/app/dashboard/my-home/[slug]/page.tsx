"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bed,
  Bath,
  Square,
  Calendar,
  MapPin,
  ArrowLeft,
  Home,
  CheckCircle2,
  FileText,
  User,
  Mail,
  Phone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  totalRooms?: number | null;
  livingAreaSqft?: number | null;
  lotSize?: string | null;
  basement?: string | null;
  pool?: boolean | null;
  garageType?: string | null;
  condition?: string | null;
  yearBuilt?: number | null;
  deedName?: string | null;
  verifiedFirstName?: string | null;
  verifiedLastName?: string | null;
  verifiedEmail?: string | null;
  verifiedPhone?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const PLACEHOLDER_IMAGE = "/images/p1.jpg";

function formatBathrooms(full?: number | null, partial?: number | null): string {
  const fullNum = full ?? 0;
  const partialNum = partial ?? 0;
  const total = fullNum + partialNum;
  if (total === 0) return "—";
  return total % 1 === 0 ? String(total) : total.toFixed(1);
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const display = value != null && value !== "" ? String(value) : "—";
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {Icon && (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-foreground">{display}</p>
      </div>
    </div>
  );
}

export default function MyHomeDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : null;
  const { data: session } = useSession();
  const [home, setHome] = useState<UserHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || !slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/v1/my-home?slug=${encodeURIComponent(slug)}`, {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const homeData: UserHome | null = json.home ?? null;
        if (cancelled) return;
        if (homeData) {
          setHome(homeData);
        } else {
          setNotFound(true);
          setHome(null);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, slug]);

  if (!session) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Please log in</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Log in to view your saved home details.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !slug) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href="/dashboard/my-home">
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden />
              Back to My Home
            </Link>
          </Button>
        </div>
        <Card className="shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !home) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href="/dashboard/my-home">
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden />
              Back to My Home
            </Link>
          </Button>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Home not found</CardTitle>
            <CardDescription>
              This property is not in your saved homes, or the link may be incorrect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="rounded-xl">
              <Link href="/dashboard/my-home">Back to My Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verifiedAtDate = home.verifiedAt ? new Date(home.verifiedAt) : null;
  const savedAtDate = new Date(home.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="rounded-xl w-fit">
          <Link href="/dashboard/my-home">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden />
            Back to My Home
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-xl w-fit">
          <Link href={`/homeowner/${home.slug}`}>
            Open on My Home page
            <Home className="h-4 w-4 ml-1" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hero card with image and address */}
        <Card className="shadow-md overflow-hidden lg:col-span-2">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-48 sm:min-h-[200px] shrink-0 bg-muted">
              <Image
                src={PLACEHOLDER_IMAGE}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 192px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-foreground">{home.addressLine}</h1>
                {home.verifiedAt ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
              {[home.city, home.state, home.zip].filter(Boolean).length > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {[home.city, home.state, home.zip].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Bed className="h-4 w-4" aria-hidden />
                  {home.bedrooms ?? "—"} bed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4" aria-hidden />
                  {formatBathrooms(home.fullBathrooms, home.partialBathrooms)} bath
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Square className="h-4 w-4" aria-hidden />
                  {home.livingAreaSqft != null ? `${home.livingAreaSqft.toLocaleString()} sq ft` : "—"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Saved / verified date */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label="Saved on"
              value={savedAtDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            />
            {verifiedAtDate && (
              <DetailRow
                label="Verified on"
                value={verifiedAtDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property details */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Property details</CardTitle>
            <CardDescription>Information you saved for this home.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="Address" value={home.addressLine} icon={MapPin} />
            <DetailRow label="Street number" value={home.streetNumber} />
            <DetailRow label="Street name" value={home.streetName} />
            <DetailRow label="City" value={home.city} />
            <DetailRow label="State / Province" value={home.state} />
            <DetailRow label="ZIP / Postal code" value={home.zip} />
            <DetailRow label="Bedrooms" value={home.bedrooms} icon={Bed} />
            <DetailRow
              label="Bathrooms"
              value={formatBathrooms(home.fullBathrooms, home.partialBathrooms)}
              icon={Bath}
            />
            <DetailRow label="Total rooms" value={home.totalRooms} />
            <DetailRow
              label="Living area (sq ft)"
              value={home.livingAreaSqft != null ? home.livingAreaSqft.toLocaleString() : null}
              icon={Square}
            />
            <DetailRow label="Lot size" value={home.lotSize} />
            <DetailRow label="Basement" value={home.basement} />
            <DetailRow label="Pool" value={home.pool == null ? null : home.pool ? "Yes" : "No"} />
            <DetailRow label="Garage type" value={home.garageType} />
            <DetailRow label="Condition" value={home.condition} />
            <DetailRow label="Year built" value={home.yearBuilt} />
          </CardContent>
        </Card>

        {/* Verification info (if verified) */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              Verification
            </CardTitle>
            <CardDescription>
              {home.verifiedAt
                ? "Details used to verify ownership."
                : "Verify this home to unlock equity and market insights."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="Name on deed" value={home.deedName} icon={User} />
            <DetailRow
              label="Verified name"
              value={
                [home.verifiedFirstName, home.verifiedLastName].filter(Boolean).length > 0
                  ? [home.verifiedFirstName, home.verifiedLastName].filter(Boolean).join(" ")
                  : null
              }
              icon={User}
            />
            <DetailRow label="Verified email" value={home.verifiedEmail} icon={Mail} />
            <DetailRow label="Verified phone" value={home.verifiedPhone} icon={Phone} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
