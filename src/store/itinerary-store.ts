import { create } from "zustand";

export interface PlaceStop {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel: number | null;
  category: string | null;
  rating?: number;
  photoName?: string;
  travelMode?: "walking" | "transit";
  travelTime?: number;
  customCost?: number;
  durationMinutes?: number;
}

interface ItineraryState {
  stops: PlaceStop[];
  totalBudget: number;
  travelMode: "walking" | "transit";
  isGenerating: boolean;
  startTime: string;

  addStop: (stop: PlaceStop) => void;
  removeStop: (index: number) => void;
  reorderStops: (from: number, to: number) => void;
  updateStopCost: (index: number, cost: number) => void;
  updateStopDuration: (index: number, minutes: number) => void;
  setTotalBudget: (budget: number) => void;
  setTravelMode: (mode: "walking" | "transit") => void;
  setStartTime: (time: string) => void;
  setIsGenerating: (val: boolean) => void;
  clearItinerary: () => void;
  getSpentBudget: () => number;
  getRemainingBudget: () => number;
}

const PRICE_LEVEL_COSTS: Record<number, number> = {
  0: 0,
  1: 15,
  2: 30,
  3: 55,
  4: 85,
};

export function getStopCost(stop: PlaceStop): number {
  if (stop.customCost !== undefined) return stop.customCost;
  if (stop.priceLevel != null) return PRICE_LEVEL_COSTS[stop.priceLevel] ?? 0;
  return 0;
}

const DEFAULT_DURATION: Record<string, number> = {
  restaurant: 60,
  cafe: 30,
  coffee_shop: 30,
  bar: 45,
  pub: 45,
  wine_bar: 45,
  cocktail_bar: 45,
  beer_hall: 45,
  museum: 90,
  art_gallery: 60,
  park: 45,
  garden: 45,
  botanical_garden: 60,
  zoo: 120,
  aquarium: 90,
  movie_theater: 120,
  performing_arts_theater: 120,
  concert_hall: 120,
  live_music_venue: 90,
  comedy_club: 90,
  bowling_alley: 60,
  amusement_park: 180,
  theme_park: 180,
  water_park: 180,
  arcade: 45,
  escape_room: 60,
  mini_golf: 45,
  spa: 90,
  night_club: 90,
  karaoke: 60,
  book_store: 30,
  library: 45,
  bakery: 20,
  ice_cream_shop: 15,
  dessert_shop: 20,
  pizza_restaurant: 45,
  sushi_restaurant: 60,
  ramen_restaurant: 40,
  seafood_restaurant: 60,
  steak_house: 75,
  brunch_restaurant: 60,
  fast_food_restaurant: 20,
  shopping_mall: 90,
  market: 45,
  flea_market: 60,
  farmers_market: 45,
  sports_complex: 60,
  gym: 60,
  skating_rink: 60,
  swimming_pool: 60,
  tourist_attraction: 45,
  landmark: 30,
  historical_landmark: 30,
  observation_deck: 45,
  casino: 120,
  hookah_bar: 60,
};

export function getStopDuration(stop: PlaceStop): number {
  if (stop.durationMinutes !== undefined) return stop.durationMinutes;
  if (stop.category) return DEFAULT_DURATION[stop.category] ?? 45;
  return 45;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  stops: [],
  totalBudget: 100,
  travelMode: "walking",
  isGenerating: false,
  startTime: "18:00",

  addStop: (stop) =>
    set((state) => ({
      stops: [...state.stops, stop],
    })),

  removeStop: (index) =>
    set((state) => ({
      stops: state.stops.filter((_, i) => i !== index),
    })),

  reorderStops: (from, to) =>
    set((state) => {
      const stops = [...state.stops];
      const [moved] = stops.splice(from, 1);
      stops.splice(to, 0, moved);
      return { stops };
    }),

  updateStopCost: (index, cost) =>
    set((state) => {
      const stops = [...state.stops];
      stops[index] = { ...stops[index], customCost: cost };
      return { stops };
    }),

  updateStopDuration: (index, minutes) =>
    set((state) => {
      const stops = [...state.stops];
      stops[index] = { ...stops[index], durationMinutes: minutes };
      return { stops };
    }),

  setTotalBudget: (budget) => set({ totalBudget: budget }),
  setTravelMode: (mode) => set({ travelMode: mode }),
  setStartTime: (time) => set({ startTime: time }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  clearItinerary: () => set({ stops: [] }),

  getSpentBudget: () => {
    return get().stops.reduce((sum, stop) => sum + getStopCost(stop), 0);
  },

  getRemainingBudget: () => {
    const state = get();
    const spent = state.stops.reduce((sum, stop) => sum + getStopCost(stop), 0);
    return state.totalBudget - spent;
  },
}));
