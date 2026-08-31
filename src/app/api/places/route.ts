import { NextRequest, NextResponse } from "next/server";
import { searchNearbyPlaces, autocompletePlace, getPlaceDetails } from "@/lib/google-places";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "autocomplete") {
      const input = searchParams.get("input");
      if (!input) {
        return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
      }
      const results = await autocompletePlace(input);
      return NextResponse.json({ places: results });
    }

    if (action === "details") {
      const placeId = searchParams.get("placeId");
      if (!placeId) {
        return NextResponse.json({ error: "Missing placeId parameter" }, { status: 400 });
      }
      const place = await getPlaceDetails(placeId);
      if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
      }
      return NextResponse.json({ place });
    }

    if (action === "nearby") {
      const lat = parseFloat(searchParams.get("lat") || "0");
      const lng = parseFloat(searchParams.get("lng") || "0");
      const radius = parseFloat(searchParams.get("radius") || "1000");
      const type = searchParams.get("type") || undefined;
      const maxPriceLevel = searchParams.get("maxPriceLevel")
        ? parseInt(searchParams.get("maxPriceLevel")!)
        : undefined;

      if (!lat || !lng) {
        return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
      }

      const results = await searchNearbyPlaces({
        lat,
        lng,
        radius,
        type,
        maxPriceLevel,
      });
      return NextResponse.json({ places: results });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
