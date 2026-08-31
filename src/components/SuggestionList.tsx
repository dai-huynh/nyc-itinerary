"use client";

import { useState, useEffect, useMemo } from "react";
import { useItineraryStore, PlaceStop, getStopCost } from "@/store/itinerary-store";
import { getMaxPriceLevelForBudget, PRICE_LEVEL_LABELS, PRICE_LEVEL_ESTIMATE } from "@/lib/budget-engine";
import { ScoredPlace, scorePlaces } from "@/lib/suggestion-engine";
import { priceLevelToNumber, PlaceResult } from "@/lib/google-places";
import { getPlacePhotoUrl } from "@/lib/photos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const FILTER_CATEGORIES = [
  {
    id: "food",
    label: "Food & Drink",
    icon: "🍽️",
    types: ["restaurant", "cafe", "coffee_shop", "bakery", "ice_cream_shop", "dessert_shop", "bubble_tea_store", "juice_shop", "pizza_restaurant", "sushi_restaurant", "ramen_restaurant", "seafood_restaurant", "steak_house", "brunch_restaurant", "fast_food_restaurant", "food_court", "chocolate_shop"],
  },
  {
    id: "drinks",
    label: "Bars & Nightlife",
    icon: "🍸",
    types: ["bar", "pub", "wine_bar", "cocktail_bar", "beer_hall", "night_club", "karaoke", "hookah_bar", "live_music_venue", "comedy_club"],
  },
  {
    id: "activities",
    label: "Activities",
    icon: "🎳",
    types: ["bowling_alley", "amusement_park", "theme_park", "arcade", "escape_room", "mini_golf", "skating_rink", "rock_climbing", "billiard_hall", "water_park", "casino"],
  },
  {
    id: "culture",
    label: "Arts & Culture",
    icon: "🎨",
    types: ["museum", "art_gallery", "performing_arts_theater", "theater", "concert_hall", "book_store", "library", "record_store", "tourist_attraction", "landmark", "historical_landmark", "observation_deck"],
  },
  {
    id: "outdoors",
    label: "Outdoors",
    icon: "🌳",
    types: ["park", "national_park", "garden", "botanical_garden", "zoo", "aquarium", "beach", "pier", "marina", "dog_park", "playground"],
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: "💆",
    types: ["spa", "beauty_salon", "nail_salon", "gym", "fitness_center", "yoga_studio", "swimming_pool"],
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "🛍️",
    types: ["shopping_mall", "market", "flea_market", "farmers_market", "clothing_store", "shoe_store", "jewelry_store", "gift_shop", "thrift_store", "vintage_store"],
  },
];

export default function SuggestionList() {
  const [rawPlaces, setRawPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showClosed, setShowClosed] = useState(false);

  const stops = useItineraryStore((state) => state.stops);
  const totalBudget = useItineraryStore((state) => state.totalBudget);
  const travelMode = useItineraryStore((state) => state.travelMode);
  const addStop = useItineraryStore((state) => state.addStop);

  const spentBudget = stops.reduce((sum, s) => sum + getStopCost(s), 0);
  const remainingBudget = totalBudget - spentBudget;
  const lastStop = stops[stops.length - 1];

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!lastStop) {
      setRawPlaces([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const maxPriceLevel = getMaxPriceLevelForBudget(remainingBudget);
        const radius = travelMode === "walking" ? 1500 : 5000;

        const res = await fetch(
          `/api/places?action=nearby&lat=${lastStop.lat}&lng=${lastStop.lng}&radius=${radius}&maxPriceLevel=${maxPriceLevel}`
        );
        const data = await res.json();

        if (data.places) {
          setRawPlaces(data.places);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [lastStop, remainingBudget, travelMode, stops]);

  const suggestions = useMemo(() => {
    if (rawPlaces.length === 0) return [];

    const existingCategories = stops
      .map((s) => s.category)
      .filter(Boolean) as string[];
    const existingPlaceIds = new Set(stops.map((s) => s.placeId));

    return scorePlaces(rawPlaces, {
      remainingBudget,
      existingCategories,
      existingPlaceIds,
      showClosed,
    });
  }, [rawPlaces, stops, remainingBudget, showClosed]);

  const handleAddPlace = async (place: ScoredPlace) => {
    let travelTime: number | undefined;

    if (lastStop) {
      try {
        const res = await fetch(
          `/api/directions?originLat=${lastStop.lat}&originLng=${lastStop.lng}&destLat=${place.location.latitude}&destLng=${place.location.longitude}&mode=${travelMode}`
        );
        const data = await res.json();
        if (data.durationSeconds) {
          travelTime = Math.round(data.durationSeconds / 60);
        }
      } catch {
        // Travel time is optional
      }
    }

    const priceLevel = priceLevelToNumber(place.priceLevel);

    const newStop: PlaceStop = {
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      lat: place.location.latitude,
      lng: place.location.longitude,
      priceLevel,
      category: place.primaryType || null,
      rating: place.rating,
      photoName: place.photos?.[0]?.name || undefined,
      travelMode,
      travelTime,
    };

    addStop(newStop);
  };

  const filteredSuggestions = activeFilters.size === 0
    ? suggestions
    : suggestions.filter((place) => {
        if (!place.primaryType) return false;
        return FILTER_CATEGORIES.some(
          (cat) => activeFilters.has(cat.id) && cat.types.includes(place.primaryType!)
        );
      });

  const displaySuggestions = filteredSuggestions.slice(0, 8);

  if (!lastStop) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Add your first stop to get suggestions for what&apos;s next!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap gap-1.5 flex-1">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleFilter(cat.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilters.has(cat.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
          </div>
          <button
            onClick={() => setShowClosed(!showClosed)}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              showClosed
                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            <span>{showClosed ? "🕐" : "🕐"}</span>
            <span>{showClosed ? "Showing closed" : "Open only"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : displaySuggestions.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">
            {activeFilters.size > 0
              ? "No matches for this filter nearby. Try another category or switch to transit mode."
              : "No suggestions found within your budget and distance. Try increasing your budget or switching to transit mode."}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          <div className="p-3 space-y-2">
            {displaySuggestions.map((place) => {
              const priceLevel = priceLevelToNumber(place.priceLevel);
              const cost = priceLevel !== null ? PRICE_LEVEL_ESTIMATE[priceLevel] : 0;

              return (
                <Card
                  key={place.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleAddPlace(place)}
                >
                  <div className="flex items-start gap-3">
                    {place.photos?.[0]?.name ? (
                      <img
                        src={getPlacePhotoUrl(place.photos[0].name, 80)}
                        alt=""
                        className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">
                        {place.displayName.text}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {place.formattedAddress}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {priceLevel !== null && (
                          <Badge variant="secondary" className="text-xs">
                            {PRICE_LEVEL_LABELS[priceLevel]} (~${cost})
                          </Badge>
                        )}
                        {place.rating && (
                          <span className="text-xs text-muted-foreground">
                            ★ {place.rating.toFixed(1)}
                          </span>
                        )}
                        {place.primaryType && (
                          <Badge variant="outline" className="text-xs">
                            {place.primaryType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
