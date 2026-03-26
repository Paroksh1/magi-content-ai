"use client";

import { useState, useCallback, useRef } from "react";

export interface ImageResult {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string;
}

export function useImageSearch() {
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();

        if (data.error && data.results?.length === 0) {
          setError(data.error);
          setResults([]);
        } else {
          setResults(data.results || []);
        }
      } catch {
        setError("Failed to search images");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const trackDownload = useCallback(async (downloadLocation: string) => {
    try {
      await fetch("/api/pexels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadLocation }),
      });
    } catch {
      // non-critical
    }
  }, []);

  return { results, loading, error, search, trackDownload };
}
