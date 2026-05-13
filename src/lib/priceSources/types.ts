// src/lib/priceSources/types.ts
// Defines the shape of any "price source" — PokemonPriceTracker today,
// possibly others tomorrow. The rest of the app talks to this shape, not to
// any specific provider.

// What we want to know about a card's market price.
export type ReferencePrice = {
  // Where this number came from - useful for showing the user
  source: string;
  // Raw "ungraded" market price, if available
  rawPrice: number | null;
  // Prices for graded versions of this card, by grade
  // e.g. {"PSA 10": 450, "PSA 9": 180 }
  gradedPrices: Record<string, number>;
  // When was this price data last updated?
  lastUpdated: Date | null;
};

// The contract a price source must fulfill.
// Any new provider just needs to implement these functions.
export type PriceSource = {
  name: string;
  // Look up reference price for a specific card.
  // Returns null if the card isn't in the sources database
  getReferencePrice(cardQuery: CardQuery): Promise<ReferencePrice | null>;
};

// What we hand to a price source to find a card.
// Different sources may use differen fields - implementations choose which to use
export type CardQuery = {
  name: string; // "Charizard"
  set?: string; // "Base set"
  number?: string; // "4"
  // Provider-specific identifiers, when we kno them
  // PokemonPriceTracker uses tcgPlayerId for direct lookups
  tcgPlayerId?: string;
};
