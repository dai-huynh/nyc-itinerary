"use client";

import { useItineraryStore } from "@/store/itinerary-store";

export default function TransitToggle() {
  const travelMode = useItineraryStore((state) => state.travelMode);
  const setTravelMode = useItineraryStore((state) => state.setTravelMode);

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
      <button
        onClick={() => setTravelMode("walking")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          travelMode === "walking"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4" r="2"/>
          <path d="M13.5 6.5l2 4.5-3.5 2 1 5.5-3 1.5-.5-4-2.5-1.5V10l3-1.5"/>
        </svg>
        Walk
      </button>
      <button
        onClick={() => setTravelMode("transit")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          travelMode === "transit"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="16" rx="2"/>
          <path d="M4 11h16"/>
          <path d="M12 3v8"/>
          <circle cx="8" cy="15" r="1"/>
          <circle cx="16" cy="15" r="1"/>
          <path d="M8 19l-2 3"/>
          <path d="M16 19l2 3"/>
        </svg>
        Transit
      </button>
    </div>
  );
}
