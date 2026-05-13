// src/lib/cards.ts
// Defines what a "tracked card" looks like in our system,
// and provides functions to load them from the data file.

import cardsData from "@/data/cards.json";

export type Card = {
  // URL-safe identifier, e.g. "base-set-charizard-psa-10"
  slug: string;
  // Human-readable display name
  displayName: string;
  // The pokemons name
  pokemonName: string;
  // Set name, e.g. "Base set"
  set: string;
  // Card number within the set, e.g "4"
  number: string;
  // Year released
  year: number;
  // Grade we're tracking; "raw" means ungraded
  grade: "raw" | "PSA 10" | "PSA 9" | "PSA 8" | "BGS 10" | "BGS 9.5" | "CGC 10";
  // Search query we use against eBay to find this exact card
  ebaySearchQuery: string;
  // Optional image URL
  imageUrl?: string;
};

export function getAllCards(): Card[] {
  return cardsData as Card[];
}

export function getCardBySlug(slug: string): Card | null {
  return getAllCards().find((c) => c.slug === slug) ?? null;
}
