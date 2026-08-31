"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useItineraryStore } from "@/store/itinerary-store";
import { VIBE_TAGS } from "@/lib/suggestion-engine";

export default function NewPlanPage() {
  const router = useRouter();
  const setTotalBudget = useItineraryStore((state) => state.setTotalBudget);
  const clearItinerary = useItineraryStore((state) => state.clearItinerary);

  const [mode, setMode] = useState<"step" | "full" | null>(null);
  const [budget, setBudget] = useState(100);
  const [numStops, setNumStops] = useState(3);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleStart = () => {
    clearItinerary();
    setTotalBudget(budget);

    if (mode === "step") {
      router.push("/plan/builder?mode=step");
    } else {
      const params = new URLSearchParams({
        mode: "full",
        budget: budget.toString(),
        stops: numStops.toString(),
        vibes: selectedVibes.join(","),
      });
      router.push(`/plan/builder?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Plan Your Outing</h1>
          <p className="text-muted-foreground mt-2">
            Choose how you want to build your itinerary
          </p>
        </div>

        {!mode && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("step")}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">Step by Step</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Pick your first spot, then get suggestions for what&apos;s next based on distance and budget
                </p>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("full")}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">Generate Full Plan</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Set your preferences and let us create a complete itinerary for you
                </p>
              </div>
            </Card>
          </div>
        )}

        {mode && (
          <Card className="p-6">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back
            </button>

            <h2 className="text-xl font-semibold mb-6">
              {mode === "step" ? "Step-by-Step Mode" : "Full Plan Mode"}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Total Budget: ${budget}
                </label>
                <Slider
                  value={[budget]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    setBudget(v);
                  }}
                  min={20}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$20</span>
                  <span>$500</span>
                </div>
              </div>

              {mode === "full" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Number of Stops: {numStops}
                    </label>
                    <Slider
                      value={[numStops]}
                      onValueChange={(val) => {
                        const v = Array.isArray(val) ? val[0] : val;
                        setNumStops(v);
                      }}
                      min={2}
                      max={8}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>2</span>
                      <span>8</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">
                      Vibe (select any)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {VIBE_TAGS.map((vibe) => (
                        <Badge
                          key={vibe}
                          variant={selectedVibes.includes(vibe) ? "default" : "outline"}
                          className="cursor-pointer text-sm px-3 py-1"
                          onClick={() => toggleVibe(vibe)}
                        >
                          {vibe}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Starting Area (optional)
                    </label>
                    <Input placeholder="e.g., East Village, Williamsburg, Midtown..." />
                  </div>
                </>
              )}

              <Button onClick={handleStart} className="w-full" size="lg">
                {mode === "step" ? "Start Planning" : "Generate Itinerary"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
