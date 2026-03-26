const FALLBACK_IMAGE = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop";

export async function fetchRelevantImage(query: string): Promise<string> {
  try {
    const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].regular;
    }
  } catch {
    // fall through
  }
  return FALLBACK_IMAGE;
}

export async function fetchImagesForSections(
  sections: { id: string; type: string; heading: string }[]
): Promise<Record<string, string>> {
  const imageMap: Record<string, string> = {};
  const imageSections = sections.filter((s) => s.type === "text_with_image");

  const results = await Promise.allSettled(
    imageSections.map(async (section) => {
      const keywords = section.heading
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .slice(0, 4)
        .join(" ");
      const url = await fetchRelevantImage(keywords);
      return { id: section.id, url };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      imageMap[result.value.id] = result.value.url;
    }
  }

  return imageMap;
}
