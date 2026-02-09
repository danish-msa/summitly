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

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (slug) {
    const home = await prisma.userHome.findUnique({
      where: { userId_slug: { userId, slug } },
    });
    return NextResponse.json({ home: home ?? null });
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

  const hasVerificationPayload =
    toStringOrUndef(verification.deedName) != null ||
    toStringOrUndef(verification.firstName) != null ||
    toStringOrUndef(verification.email) != null;

  const verificationData = hasVerificationPayload
    ? {
        deedName: toStringOrUndef(verification.deedName),
        verifiedFirstName: toStringOrUndef(verification.firstName),
        verifiedLastName: toStringOrUndef(verification.lastName),
        verifiedEmail: toStringOrUndef(verification.email),
        verifiedPhone: toStringOrUndef(verification.phone),
        verifiedAt: (() => {
          const v = toStringOrUndef(verification.verifiedAt);
          if (v) return new Date(v);
          return hasVerificationPayload ? new Date() : undefined;
        })(),
      }
    : undefined;

  const requestedDetails = {
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
  };

  const hasDetailsPayload =
    requestedDetails.bedrooms != null ||
    requestedDetails.fullBathrooms != null ||
    requestedDetails.partialBathrooms != null ||
    requestedDetails.totalRooms != null ||
    requestedDetails.livingAreaSqft != null ||
    requestedDetails.lotSize != null ||
    requestedDetails.basement != null ||
    requestedDetails.pool != null ||
    requestedDetails.garageType != null ||
    requestedDetails.condition != null ||
    requestedDetails.yearBuilt != null;

  const createData = {
    userId,
    slug,
    addressLine,
    streetNumber: toStringOrUndef(address.streetNumber),
    streetName: toStringOrUndef(address.streetName),
    city: toStringOrUndef(address.city),
    state: toStringOrUndef(address.state),
    zip: toStringOrUndef(address.zip),
    bedrooms: requestedDetails.bedrooms,
    fullBathrooms: requestedDetails.fullBathrooms,
    partialBathrooms: requestedDetails.partialBathrooms,
    totalRooms: requestedDetails.totalRooms,
    livingAreaSqft: requestedDetails.livingAreaSqft,
    lotSize: requestedDetails.lotSize,
    basement: requestedDetails.basement,
    pool: requestedDetails.pool,
    garageType: requestedDetails.garageType,
    condition: requestedDetails.condition,
    yearBuilt: requestedDetails.yearBuilt,
    ...(verificationData ?? {
      deedName: undefined,
      verifiedFirstName: undefined,
      verifiedLastName: undefined,
      verifiedEmail: undefined,
      verifiedPhone: undefined,
      verifiedAt: undefined,
    }),
  };

  const existing = await prisma.userHome.findUnique({
    where: { userId_slug: { userId, slug } },
  });

  const updateData = existing
    ? {
        userId,
        slug,
        addressLine,
        streetNumber: toStringOrUndef(address.streetNumber),
        streetName: toStringOrUndef(address.streetName),
        city: toStringOrUndef(address.city),
        state: toStringOrUndef(address.state),
        zip: toStringOrUndef(address.zip),
        // Use requested details only when the client sent them (e.g. Edit Home); otherwise keep existing
        bedrooms: hasDetailsPayload ? requestedDetails.bedrooms : existing.bedrooms,
        fullBathrooms: hasDetailsPayload ? requestedDetails.fullBathrooms : existing.fullBathrooms,
        partialBathrooms: hasDetailsPayload ? requestedDetails.partialBathrooms : existing.partialBathrooms,
        totalRooms: hasDetailsPayload ? requestedDetails.totalRooms : existing.totalRooms,
        livingAreaSqft: hasDetailsPayload ? requestedDetails.livingAreaSqft : existing.livingAreaSqft,
        lotSize: hasDetailsPayload ? requestedDetails.lotSize : existing.lotSize,
        basement: hasDetailsPayload ? requestedDetails.basement : existing.basement,
        pool: hasDetailsPayload ? requestedDetails.pool : existing.pool,
        garageType: hasDetailsPayload ? requestedDetails.garageType : existing.garageType,
        condition: hasDetailsPayload ? requestedDetails.condition : existing.condition,
        yearBuilt: hasDetailsPayload ? requestedDetails.yearBuilt : existing.yearBuilt,
        ...(verificationData ?? {
          deedName: existing.deedName,
          verifiedFirstName: existing.verifiedFirstName,
          verifiedLastName: existing.verifiedLastName,
          verifiedEmail: existing.verifiedEmail,
          verifiedPhone: existing.verifiedPhone,
          verifiedAt: existing.verifiedAt,
        }),
      }
    : createData;

  const home = await prisma.userHome.upsert({
    where: { userId_slug: { userId, slug } },
    create: createData,
    update: updateData,
  });

  return NextResponse.json({ home });
}

