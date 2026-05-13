// src/app/page.tsx
// The homepage. A search box and a list of results.

"use client";

import { useState } from "react";
import type { ScoredListing } from "@/lib/pricing";
import { scoreListings } from "@/lib/pricing";
import Link from "next/link";

export default function HomePage() {
  // State: things that can change and should re-render the page when they do
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<ScoredListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    setIsLoading(true);
    setError(null);
    setListings([]);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      // Sort by price, cheapest first
      const scored = scoreListings(data.listings);
      const sorted = scored.sort((a, b) => a.price - b.price);
      setListings(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Search eBay</h1>
        <p className="text-gray-600 mb-6">
          General search across all eBay listings. For tracked Pokémon cards
          with curated data,{" "}
          <Link href="/cards" className="text-blue-600 hover:underline">
            browse cards
          </Link>
          .
        </p>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search eBay (e.g., iphone, book, watch)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
            {error}
          </div>
        )}

        {!isLoading && listings.length === 0 && !error && (
          <p className="text-gray-500">Enter a search above to see listings.</p>
        )}

        {listings.length > 0 && (
          <p className="text-sm text-gray-600 mb-3">
            Found {listings.length} listings · median price: $
            {listings[0].medianPrice.toFixed(2)}
          </p>
        )}

        <div className="space-y-3">
          {listings.map((listing) => (
            <a
              key={listing.id}
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-4 p-4 bg-white rounded shadow hover:shadow-md transition-shadow"
            >
              {listing.imageUrl && (
                <img
                  src={listing.imageUrl}
                  alt=""
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{listing.title}</p>
                {listing.condition && (
                  <p className="text-sm text-gray-500">{listing.condition}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${listing.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{listing.currency}</p>
                {listing.deal === "great" && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                    Great deal · {Math.round(listing.discountFromMedian * 100)}%
                    below median
                  </span>
                )}
                {listing.deal === "good" && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    Good deal · {Math.round(listing.discountFromMedian * 100)}%
                    below median
                  </span>
                )}
                {listing.deal === "above-market" && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                    Above median
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
