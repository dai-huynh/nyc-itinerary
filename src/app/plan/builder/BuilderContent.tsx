"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useItineraryStore } from "@/store/itinerary-store";
import MapView from "@/components/map/MapView";
import PlaceSearch from "@/components/PlaceSearch";
import BudgetBar from "@/components/BudgetBar";
import TransitToggle from "@/components/TransitToggle";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import SuggestionList from "@/components/SuggestionList";
import GeneratePlan from "@/components/GeneratePlan";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const mode = searchParams.get("mode") || "step";
  const stops = useItineraryStore((state) => state.stops);
  const totalBudget = useItineraryStore((state) => state.totalBudget);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("stops");
  const prevStopCount = useRef(stops.length);

  useEffect(() => {
    if (stops.length > prevStopCount.current && mode === "step") {
      setActiveTab("suggestions");
    }
    prevStopCount.current = stops.length;
  }, [stops.length, mode]);

  const handleSave = async () => {
    if (!itineraryTitle.trim() || stops.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: itineraryTitle,
          totalBudget,
          stops: stops.map((stop, index) => ({
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
            durationMinutes: stop.durationMinutes,
            order: index,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/itineraries/${data.itinerary.id}`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/plan/new")}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
            <h1 className="font-semibold text-lg">
              {mode === "step" ? "Build Your Itinerary" : "Generated Itinerary"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <TransitToggle />
            {stops.length > 0 && (
              session ? (
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
                    Save Itinerary
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Your Itinerary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Input
                        placeholder="Give your itinerary a name..."
                        value={itineraryTitle}
                        onChange={(e) => setItineraryTitle(e.target.value)}
                      />
                      <Button
                        onClick={handleSave}
                        disabled={!itineraryTitle.trim() || saving}
                        className="w-full"
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  size="sm"
                  onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                >
                  Sign in to Save
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[500px]">
              <MapView />
            </div>
          </div>

          <div className="space-y-4">
            <BudgetBar />
            <PlaceSearch />

            {mode === "full" && stops.length === 0 && (
              <GeneratePlan
                budget={parseInt(searchParams.get("budget") || "100")}
                numStops={parseInt(searchParams.get("stops") || "3")}
                vibes={searchParams.get("vibes")?.split(",").filter(Boolean) || []}
              />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="stops" className="flex-1 text-sm">
                  Your Stops
                  {stops.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                      {stops.length}
                    </span>
                  )}
                </TabsTrigger>
                {mode === "step" && (
                  <TabsTrigger value="suggestions" className="flex-1 text-sm">
                    What&apos;s Next?
                    {stops.length > 0 && (
                      <span className="ml-1.5 relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="stops" className="border border-border rounded-lg overflow-hidden mt-2">
                <ItineraryTimeline />
              </TabsContent>
              {mode === "step" && (
                <TabsContent value="suggestions" className="border border-border rounded-lg overflow-hidden mt-2">
                  <SuggestionList />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
