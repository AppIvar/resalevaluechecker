// src/app/cards/[slug]/page.tsx
// Dynamic page for an individual tracked card.
// URL: /cards/[slug] — e.g., /cards/base-set-charizard-psa-10

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardBySlug } from "@/lib/cards";
import { searchListings } from "@/lib/ebay";
import { scoreListings } from "@/lib/pricing";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return { title: "Card not found — ResaleValueChecker" };
  return {
    title: `${card.displayName} — ResaleValueChecker`,
    description: `Live eBay listings and deal scores for ${card.displayName}.`,
  };
}

// Cache pages for 10 minutes. eBay listings change, but not by the second.
export const revalidate = 600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CardPage({ params }: PageProps) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    notFound();
  }

  // Fetch live listings; if eBay errors, show empty state instead of crashing
  let scored: ReturnType<typeof scoreListings> = [];
  let fetchError: string | null = null;
  try {
    const listings = await searchListings(card.ebaySearchQuery);
    scored = scoreListings(listings).sort(
      (a, b) => b.discountFromMedian - a.discountFromMedian
    );
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load listings";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4x1 mx-auto">
        <Link
          href="/cards"
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          ← All tracked cards
        </Link>

        <h1 className="text-3x1 font-bold mb-2">{card.displayName}</h1>
        <p className="text-gray-600 mb-6">
          {card.set} · {card.year} · {card.grade}
        </p>

        {fetchError && (
          <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
            {fetchError}
          </div>
        )}

        {!fetchError && scored.length === 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-700">
              No live listings match this card right now. Check back soon — eBay
              inventory turns over quickly.
            </p>
          </div>
        )}

        {scored.length > 0 && (
          <p className="text-sm text-gray-600 mb-3">
            {scored.length} live listings · median: $
            {scored[0].medianPrice.toFixed(2)}
          </p>
        )}

        <div className="space-y-3">
          {scored.map((listing) => (
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
                <p className="text-xs text-gray-500 mb-1">{listing.currency}</p>
                {listing.deal === "great" && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                    Great · {Math.round(listing.discountFromMedian * 100)}%
                    below median
                  </span>
                )}
                {listing.deal === "good" && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    Good · {Math.round(listing.discountFromMedian * 100)}% below
                    median
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
