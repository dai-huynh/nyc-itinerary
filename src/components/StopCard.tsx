"use client";

import { useState } from "react";
import { PlaceStop, useItineraryStore, getStopCost, getStopDuration } from "@/store/itinerary-store";
import { PRICE_LEVEL_LABELS } from "@/lib/budget-engine";
import { getPlacePhotoUrl } from "@/lib/photos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StopCardProps {
  stop: PlaceStop;
  index: number;
  showRemove?: boolean;
}

export default function StopCard({ stop, index, showRemove = true }: StopCardProps) {
  const removeStop = useItineraryStore((state) => state.removeStop);
  const updateStopCost = useItineraryStore((state) => state.updateStopCost);
  const updateStopDuration = useItineraryStore((state) => state.updateStopDuration);
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput] = useState("");
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState("");

  const cost = getStopCost(stop);
  const duration = getStopDuration(stop);
  const hasKnownPrice = stop.priceLevel !== null || stop.customCost !== undefined;

  const handleCostClick = () => {
    setCostInput(cost > 0 ? cost.toString() : "");
    setEditingCost(true);
  };

  const handleCostSubmit = () => {
    const parsed = parseFloat(costInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateStopCost(index, parsed);
    }
    setEditingCost(false);
  };

  const handleDurationClick = () => {
    setDurationInput(duration.toString());
    setEditingDuration(true);
  };

  const handleDurationSubmit = () => {
    const parsed = parseInt(durationInput);
    if (!isNaN(parsed) && parsed > 0) {
      updateStopDuration(index, parsed);
    }
    setEditingDuration(false);
  };

  return (
    <Card className="p-3 relative group">
      <div className="flex items-start gap-3">
        {stop.photoName ? (
          <div className="relative flex-shrink-0">
            <img
              src={getPlacePhotoUrl(stop.photoName, 80)}
              alt=""
              className="w-12 h-12 rounded-md object-cover"
            />
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {index + 1}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{stop.name}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {stop.address}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {stop.priceLevel !== null && (
              <Badge variant="secondary" className="text-xs">
                {PRICE_LEVEL_LABELS[stop.priceLevel] || "Free"}
              </Badge>
            )}
            {editingCost ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleCostSubmit(); }}
                className="flex items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  autoFocus
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  onBlur={handleCostSubmit}
                  className="w-14 h-5 text-xs border border-border rounded px-1 bg-background"
                  placeholder="0"
                />
              </form>
            ) : (
              <button
                onClick={handleCostClick}
                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                  hasKnownPrice
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                    : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-dashed border-amber-300 dark:border-amber-700"
                }`}
              >
                {hasKnownPrice ? `~$${cost}` : "Set cost"}
              </button>
            )}
            {stop.category && (
              <Badge variant="outline" className="text-xs">
                {stop.category.replace(/_/g, " ")}
              </Badge>
            )}
            {editingDuration ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleDurationSubmit(); }}
                className="flex items-center gap-1"
              >
                <input
                  type="number"
                  min="1"
                  step="5"
                  autoFocus
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={handleDurationSubmit}
                  className="w-12 h-5 text-xs border border-border rounded px-1 bg-background"
                  placeholder="min"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </form>
            ) : (
              <button
                onClick={handleDurationClick}
                className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
              >
                ~{duration} min
              </button>
            )}
            {stop.travelTime && (
              <span className="text-xs text-muted-foreground">
                {stop.travelMode === "transit" ? "🚇" : "🚶"} {stop.travelTime} min
              </span>
            )}
          </div>
        </div>
        {showRemove && (
          <button
            onClick={() => removeStop(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
            aria-label="Remove stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </Card>
  );
}
