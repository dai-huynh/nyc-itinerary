import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const itineraries = await prisma.itinerary.findMany({
    where: { userId: user.id },
    include: { stops: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ itineraries });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, totalBudget, stops, isPublic } = body;

  const itinerary = await prisma.itinerary.create({
    data: {
      title,
      totalBudget,
      isPublic: isPublic || false,
      userId: user.id,
      stops: {
        create: stops.map((stop: {
          placeId: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          priceLevel?: number;
          category?: string;
          notes?: string;
          travelMode?: string;
          travelTime?: number;
          photoName?: string;
          durationMinutes?: number;
        }, index: number) => ({
          order: index,
          placeId: stop.placeId,
          name: stop.name,
          address: stop.address,
          lat: stop.lat,
          lng: stop.lng,
          priceLevel: stop.priceLevel,
          category: stop.category,
          notes: stop.notes,
          travelMode: stop.travelMode,
          travelTime: stop.travelTime,
          photoName: stop.photoName,
          durationMinutes: stop.durationMinutes,
        })),
      },
    },
    include: { stops: true },
  });

  return NextResponse.json({ itinerary }, { status: 201 });
}
