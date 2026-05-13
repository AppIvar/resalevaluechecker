// src/lib/priceSources/pokemonPriceTracker.ts
// Adapter that implements PriceSource using PokemonPriceTracker's API.
// If we ever switch to JustTCG or Pokemon-API.com, we replace this file
// (and only this file)

import type { PriceSource, ReferencePrice, CardQuery } from "./types";

const API_BASE = "https://www.pokemonpricetracker.com/api/v2";

// In-memory cache so we don't hammer the API for the same card repeatedly
// Keyed by card identifier; cleared when the server restarts
const cache = new Map<string, { value: ReferencePrice; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(query: CardQuery): string {
  return query.tcgPlayerId
    ? `tcg:${query.tcgPlayerId}`
    : `name:${query.name}|set:${query.set ?? ""}|num:${query.number ?? ""}`;
}

// Type for the bits of the API response we actually use
// Defined loosely because PPT's response is rich and we only want a slice
type PptCardResponse = {
  name?: string;
  prices?: { market?: number };
  ebay?: {
    psa10?: { avg?: number };
    psa9?: { avg?: number };
    psa8?: { avg?: number };
  };
  updatedAt?: string;
};

async function fetchCard(query: CardQuery): Promise<PptCardResponse | null> {
  const apiKey = process.env.POKEMONPRICETRACKER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing POKEMONPRICETRACKER_API_KEY in .env.local");
  }

  // Build the URL. If we have a tcgPlayerId, use direct lookup; otherwise search
  const url = new URL(`${API_BASE}/cards`);
  if (query.tcgPlayerId) {
    url.searchParams.set("tcgPlayerId", query.tcgPlayerId);
  } else {
    url.searchParams.set("search", query.name);
    if (query.set) url.searchParams.set("set", query.set);
  }
  url.searchParams.set("limit", "1");
  url.searchParams.set("includeEbay", "true");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    console.error(
      `PPT request failed: ${response.status} ${await response.text()}`
    );
    return null;
  }

  const data = await response.json();
  const cards: PptCardResponse[] = data.data || [];
  return cards[0] ?? null;
}

export const pokemonPriceTracker: PriceSource = {
  name: "PokemonPriceTracker",

  async getReferencePrice(query: CardQuery): Promise<ReferencePrice | null> {
    // Check cache first
    const cacheKey = getCacheKey(query);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const card = await fetchCard(query);
    if (!card) return null;

    const gradedPrices: Record<string, number> = {};
    if (card.ebay?.psa10?.avg) gradedPrices["PSA 10"] = card.ebay.psa10.avg;
    if (card.ebay?.psa9?.avg) gradedPrices["PSA 9"] = card.ebay.psa9.avg;
    if (card.ebay?.psa8?.avg) gradedPrices["PSA 8"] = card.ebay.psa8.avg;

    const result: ReferencePrice = {
      source: "PokemonPriceTracker",
      rawPrice: card.prices?.market ?? null,
      gradedPrices,
      lastUpdated: card.updatedAt ? new Date(card.updatedAt) : null,
    };

    // Cache the result
    cache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return result;
  },
};
