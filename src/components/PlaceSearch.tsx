"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useItineraryStore, PlaceStop } from "@/store/itinerary-store";
import { priceLevelToNumber } from "@/lib/google-places";

interface SearchResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
}

export default function PlaceSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const addStop = useItineraryStore((state) => state.addStop);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.places) {
          setResults(data.places);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = async (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);

    try {
      const res = await fetch(`/api/places?action=details&placeId=${result.id}`);
      const data = await res.json();

      if (data.place) {
        const place = data.place;
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
        };

        addStop(newStop);
      }
    } catch (error) {
      console.error("Failed to get place details:", error);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Search for a place in NYC..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="w-full"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
            >
              <p className="text-sm font-medium truncate">{result.displayName.text}</p>
              {result.formattedAddress && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {result.formattedAddress}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
