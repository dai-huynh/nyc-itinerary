import { NextRequest, NextResponse } from "next/server";
import { getDirections } from "@/lib/google-maps";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const originLat = parseFloat(searchParams.get("originLat") || "0");
  const originLng = parseFloat(searchParams.get("originLng") || "0");
  const destLat = parseFloat(searchParams.get("destLat") || "0");
  const destLng = parseFloat(searchParams.get("destLng") || "0");
  const mode = (searchParams.get("mode") || "walking") as "walking" | "transit";

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(
      { error: "Missing origin/destination coordinates" },
      { status: 400 }
    );
  }

  try {
    const result = await getDirections(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
      mode
    );

    if (!result) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Directions API error:", error);
    return NextResponse.json(
      { error: "Failed to get directions" },
      { status: 500 }
    );
  }
}
