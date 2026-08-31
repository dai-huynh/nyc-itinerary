export const PRICE_LEVEL_LABELS: Record<number, string> = {
  0: "Free",
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

export const PRICE_LEVEL_RANGES: Record<number, { min: number; max: number }> = {
  0: { min: 0, max: 0 },
  1: { min: 10, max: 20 },
  2: { min: 20, max: 40 },
  3: { min: 40, max: 70 },
  4: { min: 70, max: 120 },
};

export const PRICE_LEVEL_ESTIMATE: Record<number, number> = {
  0: 0,
  1: 15,
  2: 30,
  3: 55,
  4: 85,
};

export function getMaxPriceLevelForBudget(remainingBudget: number): number {
  if (remainingBudget >= 70) return 4;
  if (remainingBudget >= 40) return 3;
  if (remainingBudget >= 20) return 2;
  if (remainingBudget >= 10) return 1;
  return 0;
}

export function estimateCostForPriceLevel(priceLevel: number | null): number {
  if (priceLevel === null) return 0;
  return PRICE_LEVEL_ESTIMATE[priceLevel] ?? 0;
}

export function distributeBudget(totalBudget: number, numStops: number): number[] {
  if (numStops <= 0) return [];
  const perStop = totalBudget / numStops;
  return Array(numStops).fill(perStop);
}

export function formatBudget(amount: number): string {
  return `$${Math.round(amount)}`;
}
