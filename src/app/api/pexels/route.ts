import { NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API = "https://api.pexels.com/v1";

interface PexelsPhoto {
  id: number;
  src: { tiny: string; small: string; medium: string; large: string };
  alt: string;
  photographer: string;
  photographer_url: string;
  url: string;
}

interface SearchResult {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("query")?.trim().slice(0, 200);
  if (!raw || raw.length === 0) {
    return NextResponse.json({ error: "Query parameter required (1-200 chars)" }, { status: 400 });
  }
  const query = raw;

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "Pexels API key not configured. Add PEXELS_API_KEY to .env.local", results: [] }, { status: 200 });
  }

  try {
    const res = await fetch(
      `${PEXELS_API}/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Pexels API error: ${res.status}`, details: text, results: [] }, { status: 200 });
    }

    const data = await res.json();
    const results: SearchResult[] = (data.photos || []).map((photo: PexelsPhoto) => ({
      id: String(photo.id),
      thumb: photo.src.small,
      regular: photo.src.large,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      downloadLocation: "",
    }));

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, results: [] }, { status: 200 });
  }
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
