// src/app/cards/page.tsx
// The index of all tracked cards. Links to each card's detail page.

import Link from "next/link";
import { getAllCards } from "@/lib/cards";

export default function CardsIndexPage() {
  const cards = getAllCards();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4x1 mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Home
        </Link>

        <h1 className="text-3x1 font-bold mb-2">Tracked cards</h1>
        <p className="text-gray-600 mb-6">
          Click any card to see live eBay listings sorted by deal score.
        </p>

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
      </div>
    </main>
  );
}
