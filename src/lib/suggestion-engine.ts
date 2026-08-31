import { PlaceResult, priceLevelToNumber } from "./google-places";
import { PRICE_LEVEL_ESTIMATE } from "./budget-engine";

export interface ScoredPlace extends PlaceResult {
  score: number;
  estimatedCost: number;
  distanceMeters?: number;
  travelTimeMinutes?: number;
}

interface ScoringParams {
  remainingBudget: number;
  existingCategories: string[];
  existingPlaceIds: Set<string>;
  preferredCategories?: string[];
  showClosed?: boolean;
}

const BLOCKED_TYPES = new Set([
  "hospital",
  "doctor",
  "dentist",
  "pharmacy",
  "health",
  "veterinary_care",
  "parking",
  "car_dealer",
  "car_rental",
  "car_repair",
  "car_wash",
  "gas_station",
  "electric_vehicle_charging_station",
  "apartment_building",
  "apartment_complex",
  "condominium_complex",
  "real_estate_agency",
  "insurance_agency",
  "lawyer",
  "accounting",
  "bank",
  "atm",
  "post_office",
  "local_government_office",
  "city_hall",
  "courthouse",
  "fire_station",
  "police",
  "funeral_home",
  "cemetery",
  "storage",
  "self_storage",
  "moving_company",
  "laundry",
  "dry_cleaning",
  "locksmith",
  "plumber",
  "electrician",
  "roofing_contractor",
  "general_contractor",
  "school",
  "university",
  "primary_school",
  "secondary_school",
  "preschool",
  "child_care_agency",
  "church",
  "mosque",
  "synagogue",
  "hindu_temple",
  "place_of_worship",
  "convenience_store",
  "supermarket",
  "grocery_store",
  "discount_store",
  "department_store",
  "home_improvement_store",
  "hardware_store",
  "furniture_store",
  "electronics_store",
  "pet_store",
  "auto_parts_store",
  "tire_shop",
  "travel_agency",
  "lodging",
  "hotel",
  "motel",
  "hostel",
  "bus_station",
  "train_station",
  "subway_station",
  "transit_station",
  "airport",
]);

const ALLOWED_TYPES = new Set([
  "restaurant",
  "cafe",
  "coffee_shop",
  "bar",
  "pub",
  "wine_bar",
  "cocktail_bar",
  "beer_hall",
  "museum",
  "art_gallery",
  "park",
  "national_park",
  "garden",
  "botanical_garden",
  "zoo",
  "aquarium",
  "movie_theater",
  "performing_arts_theater",
  "theater",
  "concert_hall",
  "live_music_venue",
  "comedy_club",
  "bowling_alley",
  "amusement_park",
  "theme_park",
  "water_park",
  "arcade",
  "escape_room",
  "mini_golf",
  "spa",
  "beauty_salon",
  "nail_salon",
  "night_club",
  "karaoke",
  "book_store",
  "library",
  "bakery",
  "ice_cream_shop",
  "dessert_shop",
  "chocolate_shop",
  "bubble_tea_store",
  "juice_shop",
  "pizza_restaurant",
  "sushi_restaurant",
  "ramen_restaurant",
  "seafood_restaurant",
  "steak_house",
  "brunch_restaurant",
  "fast_food_restaurant",
  "food_court",
  "shopping_mall",
  "market",
  "flea_market",
  "farmers_market",
  "clothing_store",
  "shoe_store",
  "jewelry_store",
  "gift_shop",
  "thrift_store",
  "vintage_store",
  "record_store",
  "sports_complex",
  "gym",
  "fitness_center",
  "yoga_studio",
  "rock_climbing",
  "skating_rink",
  "swimming_pool",
  "golf_course",
  "tennis_court",
  "basketball_court",
  "playground",
  "dog_park",
  "beach",
  "pier",
  "marina",
  "tourist_attraction",
  "landmark",
  "historical_landmark",
  "observation_deck",
  "casino",
  "billiard_hall",
  "hookah_bar",
]);

function isActivityPlace(type: string | undefined): boolean {
  if (!type) return false;
  if (BLOCKED_TYPES.has(type)) return false;
  if (ALLOWED_TYPES.has(type)) return true;
  return false;
}

export function scorePlaces(
  places: PlaceResult[],
  params: ScoringParams
): ScoredPlace[] {
  const { remainingBudget, existingCategories, existingPlaceIds, preferredCategories, showClosed = false } = params;

  return places
    .map((place) => {
      if (existingPlaceIds.has(place.id)) return null;

      if (!isActivityPlace(place.primaryType)) return null;

      const isOpen = place.currentOpeningHours?.openNow;
      if (!showClosed && isOpen === false) return null;

      const priceLevel = priceLevelToNumber(place.priceLevel);
      const estimatedCost = priceLevel !== null ? PRICE_LEVEL_ESTIMATE[priceLevel] ?? 0 : 0;

      if (estimatedCost > remainingBudget) {
        return null;
      }

      let score = 50;

      if (place.rating) {
        score += (place.rating - 3) * 10;
      }

      if (place.primaryType && existingCategories.includes(place.primaryType)) {
        score -= 15;
      }

      if (preferredCategories && place.primaryType && preferredCategories.includes(place.primaryType)) {
        score += 20;
      }

      if (remainingBudget < 50 && priceLevel !== null && priceLevel <= 1) {
        score += 10;
      }

      if (isOpen) {
        score += 5;
      }

      return {
        ...place,
        score: Math.max(0, Math.min(100, score)),
        estimatedCost,
      } as ScoredPlace;
    })
    .filter((p): p is ScoredPlace => p !== null)
    .sort((a, b) => b.score - a.score);
}

export const ACTIVITY_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "museum", label: "Museum" },
  { value: "park", label: "Park" },
  { value: "movie_theater", label: "Movie Theater" },
  { value: "bowling_alley", label: "Bowling" },
  { value: "art_gallery", label: "Art Gallery" },
  { value: "shopping_mall", label: "Shopping" },
  { value: "spa", label: "Spa" },
  { value: "amusement_park", label: "Amusement" },
  { value: "night_club", label: "Nightclub" },
  { value: "book_store", label: "Bookstore" },
  { value: "bakery", label: "Bakery" },
  { value: "ice_cream_shop", label: "Ice Cream" },
];

export const VIBE_TAGS = [
  "chill",
  "active",
  "food-focused",
  "cultural",
  "outdoors",
  "nightlife",
  "romantic",
  "adventurous",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export const VIBE_TO_TYPES: Record<VibeTag, string[]> = {
  chill: ["cafe", "park", "book_store", "spa"],
  active: ["bowling_alley", "amusement_park", "park"],
  "food-focused": ["restaurant", "cafe", "bakery", "ice_cream_shop"],
  cultural: ["museum", "art_gallery", "book_store"],
  outdoors: ["park"],
  nightlife: ["bar", "night_club"],
  romantic: ["restaurant", "cafe", "art_gallery", "park"],
  adventurous: ["amusement_park", "bowling_alley", "night_club"],
};
