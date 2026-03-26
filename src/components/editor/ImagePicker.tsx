"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Loader2, X, ImageIcon } from "lucide-react";
import { useImageSearch, type ImageResult } from "@/lib/hooks/useImageSearch";

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: ImageResult) => void;
  initialQuery?: string;
}

export function ImagePicker({ isOpen, onClose, onSelect, initialQuery }: ImagePickerProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const { results, loading, error, search, trackDownload } = useImageSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      search(initialQuery);
    }
  }, [isOpen, initialQuery, search]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    search(value);
  }, [search]);

  const handleSelect = useCallback((image: ImageResult) => {
    trackDownload(image.downloadLocation);
    onSelect(image);
    onClose();
  }, [onSelect, onClose, trackDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">Choose Image</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search for images..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/20"
            />
            {loading && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">{error}</p>
              {error.includes("not configured") && (
                <p className="text-xs text-muted-foreground mt-2">
                  Add PEXELS_API_KEY to .env.local to enable image search
                </p>
              )}
            </div>
          )}

          {!error && results.length === 0 && !loading && query && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No images found</p>
            </div>
          )}

          {!error && results.length === 0 && !loading && !query && (
            <div className="text-center py-8">
              <ImageIcon size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Search for stock photos</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {results.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleSelect(image)}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                >
                  <img
                    src={image.thumb}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{image.photographer}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="px-5 py-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Photos by{" "}
              <a
                href="https://www.pexels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Pexels
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
