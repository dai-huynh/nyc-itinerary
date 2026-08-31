"use client";

import { useItineraryStore, getStopCost } from "@/store/itinerary-store";
import { formatBudget } from "@/lib/budget-engine";

export default function BudgetBar() {
  const totalBudget = useItineraryStore((state) => state.totalBudget);
  const stops = useItineraryStore((state) => state.stops);

  const spent = stops.reduce((sum, stop) => sum + getStopCost(stop), 0);
  const remaining = totalBudget - spent;
  const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const unknownCount = stops.filter(
    (s) => s.priceLevel === null && s.customCost === undefined
  ).length;

  const getBarColor = () => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="w-full p-4 rounded-lg bg-card border border-border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Budget</span>
        <span className="text-sm font-semibold">
          {formatBudget(spent)} / {formatBudget(totalBudget)}
        </span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className={`text-xs font-medium ${remaining < 0 ? "text-red-500" : "text-muted-foreground"}`}>
          {remaining >= 0 ? `${formatBudget(remaining)} remaining` : `${formatBudget(Math.abs(remaining))} over budget`}
        </span>
        <span className="text-xs text-muted-foreground">
          {stops.length} {stops.length === 1 ? "stop" : "stops"}
        </span>
      </div>
      {unknownCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          {unknownCount} {unknownCount === 1 ? "stop has" : "stops have"} no price info — tap the cost on a stop to set it manually
        </p>
      )}
    </div>
  );
}
