// scripts/testPriceLookup.ts
// One-off script: looks up reference prices for all tracked cards.
// Run with: npx tsx scripts/testPriceLookup.ts
// (you may need to install tsx first: npm install -D tsx)

import { config } from "dotenv";
config({ path: ".env.local" });

import { getAllCards } from "../src/lib/cards";
import { pokemonPriceTracker } from "@/lib/priceSources/pokemonPriceTracker";

async function main() {
  const cards = getAllCards();
  console.log(`Looking up prices for ${cards.length} cards...\n`);

  for (const card of cards) {
    const result = await pokemonPriceTracker.getReferencePrice({
      name: card.pokemonName,
      set: card.set,
      number: card.number || undefined,
    });

    if (!result) {
      console.log(`❌ ${card.displayName}: not found`);
      continue;
    }

    const graded = result.gradedPrices[card.grade];
    console.log(
      `✅ ${card.displayName}: ` +
        (graded
          ? `$${graded} (${card.grade})`
          : `raw $${result.rawPrice ?? "?"}`)
    );
  }
}

main().catch((err) => {
  console.error("Script failed", err);
  process.exit(1);
});
