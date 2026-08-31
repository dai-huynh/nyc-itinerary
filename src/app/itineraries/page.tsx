"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBudget } from "@/lib/budget-engine";

interface SavedItinerary {
  id: string;
  title: string;
  totalBudget: number | null;
  isPublic: boolean;
  createdAt: string;
  stops: { id: string; name: string; order: number }[];
}

export default function ItinerariesPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const res = await fetch("/api/itineraries");
        if (res.status === 401) {
          router.push("/auth/signin");
          return;
        }
        const data = await res.json();
        setItineraries(data.itineraries || []);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchItineraries();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Itineraries</h1>
            <p className="text-muted-foreground mt-1">Your saved outings</p>
          </div>
          <Button onClick={() => router.push("/plan/new")}>
            New Itinerary
          </Button>
        </div>

        {itineraries.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <h3 className="font-semibold text-lg">No itineraries yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first itinerary to see it here
            </p>
            <Button className="mt-4" onClick={() => router.push("/plan/new")}>
              Create Itinerary
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {itineraries.map((itinerary) => (
              <Card
                key={itinerary.id}
                className="p-5 cursor-pointer hover:border-primary transition-colors"
                onClick={() => router.push(`/itineraries/${itinerary.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{itinerary.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {itinerary.stops.length} {itinerary.stops.length === 1 ? "stop" : "stops"}
                      {itinerary.totalBudget != null && itinerary.totalBudget > 0 ? ` · ${formatBudget(itinerary.totalBudget)} budget` : ""}
                    </p>
                  </div>
                  {itinerary.isPublic && (
                    <Badge variant="secondary">Public</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {itinerary.stops.slice(0, 4).map((stop) => (
                    <Badge key={stop.id} variant="outline" className="text-xs">
                      {stop.name}
                    </Badge>
                  ))}
                  {itinerary.stops.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{itinerary.stops.length - 4} more
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(itinerary.createdAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
