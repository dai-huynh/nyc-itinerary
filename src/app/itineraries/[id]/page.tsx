"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICE_LEVEL_LABELS, formatBudget } from "@/lib/budget-engine";
import { getPlacePhotoUrl } from "@/lib/photos";

interface Stop {
  id: string;
  placeId: string;
  name: string;
  address: string;
  order: number;
  priceLevel: number | null;
  category: string | null;
  travelMode: string | null;
  travelTime: number | null;
  lat: number;
  lng: number;
  photoName: string | null;
}

interface ItineraryDetail {
  id: string;
  title: string;
  totalBudget: number | null;
  isPublic: boolean;
  createdAt: string;
  stops: Stop[];
}

export default function ItineraryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editStops, setEditStops] = useState<Stop[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [togglingShare, setTogglingShare] = useState(false);

  // Add stop search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: { text: string }; formattedAddress: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await fetch(`/api/itineraries/${id}`);
        if (res.ok) {
          const data = await res.json();
          setItinerary(data.itinerary);
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchItinerary();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePublic = async () => {
    if (!itinerary) return;
    setTogglingShare(true);
    try {
      const res = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !itinerary.isPublic }),
      });
      if (res.ok) {
        const data = await res.json();
        setItinerary(data.itinerary);
      }
    } catch (error) {
      console.error("Failed to toggle share:", error);
    } finally {
      setTogglingShare(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditing = () => {
    if (!itinerary) return;
    setEditStops([...itinerary.stops].sort((a, b) => a.order - b.order));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditStops([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeStop = (index: number) => {
    setEditStops((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= editStops.length) return;
    setEditStops((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveStop(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.places) {
          setSearchResults(data.places);
          setSearchOpen(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const addStopFromSearch = async (result: { id: string; displayName: { text: string } }) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/places?action=details&placeId=${result.id}`);
      const data = await res.json();
      if (data.place) {
        const place = data.place;
        const priceLevelMap: Record<string, number> = {
          PRICE_LEVEL_FREE: 0,
          PRICE_LEVEL_INEXPENSIVE: 1,
          PRICE_LEVEL_MODERATE: 2,
          PRICE_LEVEL_EXPENSIVE: 3,
          PRICE_LEVEL_VERY_EXPENSIVE: 4,
        };

        const newStop: Stop = {
          id: `new-${Date.now()}`,
          placeId: place.id,
          name: place.displayName.text,
          address: place.formattedAddress,
          order: editStops.length,
          priceLevel: place.priceLevel ? priceLevelMap[place.priceLevel] ?? null : null,
          category: place.primaryType || null,
          travelMode: null,
          travelTime: null,
          lat: place.location.latitude,
          lng: place.location.longitude,
          photoName: place.photos?.[0]?.name || null,
        };
        setEditStops((prev) => [...prev, newStop]);
      }
    } catch (error) {
      console.error("Failed to get place details:", error);
    }
  };

  const saveChanges = async () => {
    if (!itinerary) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stops: editStops.map((stop) => ({
            placeId: stop.placeId,
            name: stop.name,
            address: stop.address,
            lat: stop.lat,
            lng: stop.lng,
            priceLevel: stop.priceLevel,
            category: stop.category,
            travelMode: stop.travelMode,
            travelTime: stop.travelTime,
            photoName: stop.photoName,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setItinerary(data.itinerary);
        setEditing(false);
        setEditStops([]);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-semibold text-lg">Itinerary not found</h2>
          <Button className="mt-4" onClick={() => router.push("/itineraries")}>
            Back to Itineraries
          </Button>
        </Card>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/itineraries/${itinerary.id}`
    : "";

  const displayStops = editing ? editStops : [...itinerary.stops].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/itineraries")}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Back to Itineraries
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{itinerary.title}</h1>
            <p className="text-muted-foreground mt-1">
              {displayStops.length} stops
              {itinerary.totalBudget != null && itinerary.totalBudget > 0 ? ` · ${formatBudget(itinerary.totalBudget)} budget` : ""}
              {" · "}
              {new Date(itinerary.createdAt).toLocaleDateString()}
            </p>
            {itinerary.isPublic && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Public — anyone with the link can view
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePublic}
                  disabled={togglingShare}
                >
                  {itinerary.isPublic ? "Make Private" : "Make Public"}
                </Button>
                {itinerary.isPublic && (
                  <Button size="sm" onClick={copyShareLink}>
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {editing && (
          <div ref={searchWrapperRef} className="relative mb-6">
            <Input
              placeholder="Search for a place to add..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => addStopFromSearch(result)}
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
        )}

        <div className="space-y-3">
          {displayStops.map((stop, index) => (
            <div
              key={stop.id}
              draggable={editing}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={editing ? "cursor-grab active:cursor-grabbing" : ""}
            >
              {index > 0 && stop.travelTime && !editing && (
                <div className="flex items-center gap-2 py-2 px-4">
                  <div className="flex-1 border-t border-dashed border-border" />
                  <span className="text-xs text-muted-foreground">
                    {stop.travelMode === "transit" ? "🚇" : "🚶"} {stop.travelTime} min
                  </span>
                  <div className="flex-1 border-t border-dashed border-border" />
                </div>
              )}
              <Card className={`p-4 ${editing ? "border-dashed" : ""} ${dragIndex === index ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  {editing && (
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                      <button
                        onClick={() => moveStop(index, index - 1)}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18,15 12,9 6,15"/>
                        </svg>
                      </button>
                      <span className="text-xs text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
                        </svg>
                      </span>
                      <button
                        onClick={() => moveStop(index, index + 1)}
                        disabled={index === displayStops.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 12,15 18,9"/>
                        </svg>
                      </button>
                    </div>
                  )}
                  {stop.photoName ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={getPlacePhotoUrl(stop.photoName, 200)}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow">
                        {index + 1}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{stop.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {stop.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {stop.priceLevel !== null && (
                        <Badge variant="secondary">
                          {PRICE_LEVEL_LABELS[stop.priceLevel]}
                        </Badge>
                      )}
                      {stop.category && (
                        <Badge variant="outline">
                          {stop.category.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {editing && (
                    <button
                      onClick={() => removeStop(index)}
                      className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0"
                      aria-label="Remove stop"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {editing && displayStops.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">
              All stops removed. Search above to add new ones, or cancel to revert.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
