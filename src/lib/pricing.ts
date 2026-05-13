// src/lib/pricing.ts
// Pure functions for analyzing listing prices.
// No knowledge of eBay, React, or the network — just numbers in, numbers out.

import { Listing } from "./ebay";

// A listing with extra fields telling us how it compares to the others.
export type ScoredListing = Listing & {
  medianPrice: number;
  // How far below the median, as a fraction (0.3 = 30% below).
  // Negative means above median.
  discountFromMedian: number;
  // Our verdict for the UI
  deal: "great" | "good" | "fair" | "above-market";
};

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  //Even count: average the two middle values
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  // Odd count: take the middle value
  return sorted[middle];
}

export function scoreListings(listings: Listing[]): ScoredListing[] {
  // Filter out zero-priced listings — they break the math and aren't useful
  const validListings = listings.filter((l) => l.price > 0);

  if (validListings.length === 0) return [];

  const median = calculateMedian(validListings.map((l) => l.price));

  return validListings.map((listing) => {
    const discountFromMedian = (median - listing.price) / median;

    let deal: ScoredListing["deal"];
    if (discountFromMedian >= 0.25) deal = "great"; // 25%+ below median
    else if (discountFromMedian >= 0.15) deal = "good"; // 15–25% below
    else if (discountFromMedian >= -0.05) deal = "fair"; // around median
    else deal = "above-market"; // 5%+ above median

    return {
      ...listing,
      medianPrice: median,
      discountFromMedian,
      deal,
    };
  });
}
