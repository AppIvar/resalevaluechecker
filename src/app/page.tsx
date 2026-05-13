// src/app/page.tsx
// The homepage. Featured cards grid + brief intro.

import Link from "next/link";
import { getAllCards } from "@/lib/cards";

export default function HomePage() {
  const cards = getAllCards();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4x1 mx-auto px-8 py-12">
          <h1 className="text-4x1 font-bold mb-3">ResaleValueChecker</h1>
          <p className="text-lg text-gray-700 mb-2">
            Find underpriced Pokèmon cards on eBay.
          </p>
          <p className="text-sm text-gray-600">
            We track market prices for popular graded cards and surface live
            listings priced below the median - so you can spot a deal at a
            glance.
          </p>
        </div>
      </section>

      {/* Featured cards */}
      <section className="max-w-4x1 mx-auto px-8 py-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2x1 font-bold">Tracked card</h2>
          <Link
            href="/search"
            className="text-sm text-blue-600 hover:underline"
          >
            General eBay search →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cards.map((card) => (
            <Link
              key={card.slug}
              href={`/cards/${card.slug}`}
              className="block p-4 bg-white rounded shadow hover:shadow-md transition-shadow"
            >
              <p className="font-medium">{card.displayName}</p>
              <p className="text-sm text-gray-500">
                {card.set} · {card.year} · {card.grade}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
