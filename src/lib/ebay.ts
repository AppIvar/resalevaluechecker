// src/lib/ebay.ts
// Talks to eBay's API. Two functions:
//   1. getAccessToken() — exchanges credentials for a temporary token
//   2. searchListings()  — uses the token to search eBay

const EBAY_ENV = process.env.EBAY_ENV ?? "sandbox";
const EBAY_BASE =
  EBAY_ENV === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
const EBAY_OAUTH_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;
const EBAY_SEARCH_URL = `${EBAY_BASE}/buy/browse/v1/item_summary/search`;

// Cache the token in memory so we don't request a new one every search.
// Tokens last ~2 hours; we refresh when expired.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Reuse cached token if still valid (with 1-min safety buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    throw new Error("Missing EBAY_APP_ID or EBAY_CERT_ID in .env.local");
  }

  // eBay wants credentials as Base64-encoded "appId:certId"
  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

  const response = await fetch(EBAY_OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `eBay token request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
}

// What we return to the frontend — just the fields we care about.
export type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string | null;
  condition: string | null;
};

type EbayItemSummary = {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  itemWebUrl: string;
  image?: { imageUrl: string };
  condition?: string;
};

export async function searchListings(query: string): Promise<Listing[]> {
  const token = await getAccessToken();

  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "50");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`eBay search failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // eBay's response has lots of fields we don't need. Map to our simpler shape.
  const items = data.itemSummaries || [];
  return items.map((item: EbayItemSummary) => ({
    id: item.itemId,
    title: item.title,
    price: parseFloat(item.price?.value || "0"),
    currency: item.price?.currency || "USD",
    url: item.itemWebUrl,
    imageUrl: item.image?.imageUrl || null,
    condition: item.condition || null,
  }));
}
