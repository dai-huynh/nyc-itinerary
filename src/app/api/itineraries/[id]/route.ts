import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      stops: { orderBy: { order: "asc" } },
      user: { select: { name: true, image: true } },
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!itinerary.isPublic) {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.id !== itinerary.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ itinerary });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const itinerary = await prisma.itinerary.findUnique({ where: { id } });
  if (!itinerary || itinerary.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, totalBudget, isPublic, stops } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (totalBudget !== undefined) updateData.totalBudget = totalBudget;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  if (stops !== undefined) {
    await prisma.stop.deleteMany({ where: { itineraryId: id } });
    await prisma.stop.createMany({
      data: stops.map((stop: {
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
        itineraryId: id,
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
    });
  }

  const updated = await prisma.itinerary.update({
    where: { id },
    data: updateData,
    include: { stops: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ itinerary: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
  });

  if (!itinerary || itinerary.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.itinerary.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
