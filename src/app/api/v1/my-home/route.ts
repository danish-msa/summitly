import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth-utils";
import { prisma } from "@/lib/prisma";

function toInt(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function toFloat(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function toStringOrUndef(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

function toBooleanOrUndef(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  const userId = auth?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const homes = await prisma.userHome.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ homes });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  const userId = auth?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const bodyObj = body as Record<string, unknown>;

  const slug = toStringOrUndef(bodyObj.slug);
  const addressLine = toStringOrUndef(bodyObj.addressLine);

  if (!slug || !addressLine) {
    return NextResponse.json({ error: "Missing required fields: slug, addressLine" }, { status: 400 });
  }

  const address = (bodyObj.address ?? {}) as Record<string, unknown>;
  const details = (bodyObj.details ?? {}) as Record<string, unknown>;
  const verification = (bodyObj.verification ?? {}) as Record<string, unknown>;

  const data = {
    userId,
    slug,
    addressLine,
    streetNumber: toStringOrUndef(address.streetNumber),
    streetName: toStringOrUndef(address.streetName),
    city: toStringOrUndef(address.city),
    state: toStringOrUndef(address.state),
    zip: toStringOrUndef(address.zip),

    bedrooms: toInt(details.bedrooms),
    fullBathrooms: toFloat(details.fullBathrooms),
    partialBathrooms: toFloat(details.partialBathrooms),
    totalRooms: toInt(details.totalRooms),
    livingAreaSqft: toInt(details.livingAreaSqft),
    lotSize: toStringOrUndef(details.lotSize),
    basement: toStringOrUndef(details.basement),
    pool: toBooleanOrUndef(details.pool),
    garageType: toStringOrUndef(details.garageType),
    condition: toStringOrUndef(details.condition),
    yearBuilt: toInt(details.yearBuilt),

    deedName: toStringOrUndef(verification.deedName),
    verifiedFirstName: toStringOrUndef(verification.firstName),
    verifiedLastName: toStringOrUndef(verification.lastName),
    verifiedEmail: toStringOrUndef(verification.email),
    verifiedPhone: toStringOrUndef(verification.phone),
    verifiedAt: (() => {
      const v = toStringOrUndef(verification.verifiedAt);
      if (v) return new Date(v);
      // If they provided deedName but no explicit timestamp, record "now"
      return toStringOrUndef(verification.deedName) ? new Date() : undefined;
    })(),
  };

  const home = await prisma.userHome.upsert({
    where: { userId_slug: { userId, slug } },
    create: data,
    update: data,
  });

  return NextResponse.json({ home });
}

