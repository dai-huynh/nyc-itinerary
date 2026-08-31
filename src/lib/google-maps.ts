const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export interface DirectionsResult {
  durationSeconds: number;
  durationText: string;
  distanceMeters: number;
  distanceText: string;
  steps: string[];
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: "walking" | "transit"
): Promise<DirectionsResult | null> {
  const travelMode = mode === "walking" ? "WALK" : "TRANSIT";

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs.steps.navigationInstruction",
    },
    body: JSON.stringify({
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  const durationSeconds = parseInt(route.duration?.replace("s", "") || "0");
  const distanceMeters = route.distanceMeters || 0;

  return {
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    steps: route.legs?.[0]?.steps?.map(
      (s: { navigationInstruction?: { instructions: string } }) =>
        s.navigationInstruction?.instructions || ""
    ).filter(Boolean) || [],
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
