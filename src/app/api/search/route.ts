// src/app/api/search/route.ts
// Backend endpoint at /api/search?q=...
// Returns listings from eBay as JSON.

import { searchListings } from "@/lib/ebay";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
        return NextResponse.json(
            { error: "Missing 'q' query parameter" },
            { status: 400 }
        );
    }
    try {
        const listings = await searchListings(query);
        return NextResponse.json({ listings });
    }   catch (error) {
        console.error("Search failed:", error);
        return NextResponse.json(
            { error: "Search failed. Check server logs." },
            { status: 500 }
        );
    }
}
