const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE_URL = "https://places.googleapis.com/v1/places";

export interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  priceLevel?: string;
  rating?: number;
  primaryType?: string;
  photos?: { name: string }[];
  currentOpeningHours?: { openNow: boolean };
}

export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius: number;
  type?: string;
  maxPriceLevel?: number;
  maxResults?: number;
}

export async function searchNearbyPlaces(params: NearbySearchParams): Promise<PlaceResult[]> {
  const { lat, lng, radius, type, maxPriceLevel, maxResults = 20 } = params;

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
    maxResultCount: maxResults,
    rankPreference: "DISTANCE",
  };

  if (type) {
    body.includedTypes = [type];
  }

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.priceLevel",
    "places.rating",
    "places.primaryType",
    "places.photos",
    "places.currentOpeningHours",
  ].join(",");

  const res = await fetch(`${BASE_URL}:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google Places API error: ${error}`);
  }

  const data = await res.json();
  let places: PlaceResult[] = data.places || [];

  if (maxPriceLevel !== undefined) {
    places = places.filter((p) => {
      const level = priceLevelToNumber(p.priceLevel);
      return level === null || level <= maxPriceLevel;
    });
  }

  return places;
}

export async function autocompletePlace(input: string): Promise<PlaceResult[]> {
  const res = await fetch(`${BASE_URL}:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
    },
    body: JSON.stringify({
      input,
      locationBias: {
        circle: {
          center: { latitude: 40.7128, longitude: -74.006 },
          radius: 20000,
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Autocomplete error: ${error}`);
  }

  const data = await res.json();
  return data.suggestions?.map((s: { placePrediction: { placeId: string; text: { text: string } } }) => ({
    id: s.placePrediction.placeId,
    displayName: { text: s.placePrediction.text.text },
    formattedAddress: "",
    location: { latitude: 0, longitude: 0 },
  })) || [];
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "priceLevel",
    "rating",
    "primaryType",
    "photos",
    "currentOpeningHours",
  ].join(",");

  const res = await fetch(`${BASE_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!res.ok) return null;
  return res.json();
}

export function priceLevelToNumber(priceLevel?: string): number | null {
  if (!priceLevel) return null;
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[priceLevel] ?? null;
}

export function getPhotoUrl(photoName: string, maxWidth = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}
