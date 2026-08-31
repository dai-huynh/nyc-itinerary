"use client";

import { useState } from "react";
import { useItineraryStore, PlaceStop } from "@/store/itinerary-store";
import { VIBE_TO_TYPES, VibeTag } from "@/lib/suggestion-engine";
import { getMaxPriceLevelForBudget } from "@/lib/budget-engine";
import { priceLevelToNumber } from "@/lib/google-places";
import { Button } from "@/components/ui/button";

interface GeneratePlanProps {
  budget: number;
  numStops: number;
  vibes: string[];
}

export default function GeneratePlan({ budget, numStops, vibes }: GeneratePlanProps) {
  const [generating, setGenerating] = useState(false);
  const addStop = useItineraryStore((state) => state.addStop);
  const setTotalBudget = useItineraryStore((state) => state.setTotalBudget);
  const clearItinerary = useItineraryStore((state) => state.clearItinerary);

  const generate = async () => {
    setGenerating(true);
    clearItinerary();
    setTotalBudget(budget);

    try {
      const types = vibes.flatMap((v) => VIBE_TO_TYPES[v as VibeTag] || []);
      const uniqueTypes = [...new Set(types)];

      const budgetPerStop = budget / numStops;
      const maxPriceLevel = getMaxPriceLevelForBudget(budgetPerStop);

      // Start from a central NYC location
      let currentLat = 40.7128;
      let currentLng = -74.006;
      const usedPlaceIds = new Set<string>();

      for (let i = 0; i < numStops; i++) {
        const type = uniqueTypes.length > 0
          ? uniqueTypes[i % uniqueTypes.length]
          : undefined;

        const res = await fetch(
          `/api/places?action=nearby&lat=${currentLat}&lng=${currentLng}&radius=2000&maxPriceLevel=${maxPriceLevel}${type ? `&type=${type}` : ""}`
        );
        const data = await res.json();

        if (data.places && data.places.length > 0) {
          const available = data.places.filter(
            (p: { id: string }) => !usedPlaceIds.has(p.id)
          );
          const place = available[0] || data.places[0];

          usedPlaceIds.add(place.id);
          const priceLevel = priceLevelToNumber(place.priceLevel);

          let travelTime: number | undefined;
          if (i > 0) {
            try {
              const dirRes = await fetch(
                `/api/directions?originLat=${currentLat}&originLng=${currentLng}&destLat=${place.location.latitude}&destLng=${place.location.longitude}&mode=walking`
              );
              const dirData = await dirRes.json();
              if (dirData.durationSeconds) {
                travelTime = Math.round(dirData.durationSeconds / 60);
              }
            } catch {
              // Optional
            }
          }

          const stop: PlaceStop = {
            placeId: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            lat: place.location.latitude,
            lng: place.location.longitude,
            priceLevel,
            category: place.primaryType || null,
            rating: place.rating,
            photoName: place.photos?.[0]?.name || undefined,
            travelMode: "walking",
            travelTime,
          };

          addStop(stop);
          currentLat = place.location.latitude;
          currentLng = place.location.longitude;
        }
      }
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <p className="text-sm text-muted-foreground mb-3">
        Ready to generate a {numStops}-stop itinerary
        {vibes.length > 0 && ` with ${vibes.join(", ")} vibes`} for ${budget}?
      </p>
      <Button onClick={generate} disabled={generating} className="w-full">
        {generating ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate Itinerary"
        )}
      </Button>
    </div>
  );
}
