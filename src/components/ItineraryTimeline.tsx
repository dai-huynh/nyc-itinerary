"use client";

import { useItineraryStore, getStopDuration } from "@/store/itinerary-store";
import StopCard from "./StopCard";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function ItineraryTimeline() {
  const stops = useItineraryStore((state) => state.stops);
  const startTime = useItineraryStore((state) => state.startTime);
  const setStartTime = useItineraryStore((state) => state.setStartTime);

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h3 className="font-semibold text-foreground">No stops yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Search for a place to get started
        </p>
      </div>
    );
  }

  const startMinutes = parseTime(startTime);
  const timeline: { startMin: number; endMin: number; travelMin: number }[] = [];
  let cursor = startMinutes;

  for (let i = 0; i < stops.length; i++) {
    const travel = i > 0 ? (stops[i].travelTime || 0) : 0;
    cursor += travel;
    const dur = getStopDuration(stops[i]);
    timeline.push({ startMin: cursor, endMin: cursor + dur, travelMin: travel });
    cursor += dur;
  }

  const endTime = cursor;

  return (
    <div>
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-border mb-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Start at</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="text-xs border border-border rounded px-1.5 py-0.5 bg-background"
        />
        {stops.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            Ends ~{formatTime(endTime)}
          </span>
        )}
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-0">
          {stops.map((stop, index) => (
            <div key={`${stop.placeId}-${index}`}>
              {index > 0 && timeline[index].travelMin > 0 && (
                <div className="flex items-center gap-2 py-1 px-4">
                  <div className="flex-1 border-t border-dashed border-border" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {stop.travelMode === "transit" ? "🚇" : "🚶"} {timeline[index].travelMin} min
                  </span>
                  <div className="flex-1 border-t border-dashed border-border" />
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center pt-3 w-14 flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {formatTime(timeline[index].startMin)}
                  </span>
                  <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <StopCard stop={stop} index={index} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
