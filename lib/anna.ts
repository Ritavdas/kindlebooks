export interface SearchResult {
  md5: string;
  title: string;
  author: string | null;
  ext: string;
  size: string | null;
  year: string | null;
  genre: string | null;
  imgUrl: string | null;
  imgFallbackColor: string | null;
  sources: string[];
}

function host(): string {
  return process.env.RAPIDAPI_HOST || "annas-archive-api.p.rapidapi.com";
}

function headers(): Record<string, string> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set in .env");
  return {
    "x-rapidapi-key": key,
    "x-rapidapi-host": host(),
  };
}

interface ApiBook {
  md5?: string;
  title?: string;
  author?: string;
  size?: string;
  ext?: string;
  format?: string;
  year?: string;
  genre?: string;
  imgUrl?: string;
  imgFallbackColor?: string;
  sources?: string[];
}

export async function searchEpubs(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    ext: "epub",
    sort: "mostRelevant",
    source: "libgenLi, libgenRs",
  });
  const url = `https://${host()}/search?${params.toString()}`;

  const res = await fetch(url, { headers: headers() });
  if (res.status === 429) {
    throw new Error("RapidAPI rate limit reached. Try again later.");
  }
  if (!res.ok) {
    throw new Error(`Search failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { books?: ApiBook[] };
  const books = data.books ?? [];

  return books
    .filter((b) => b.md5 && b.title)
    .map((b) => ({
      md5: b.md5 as string,
      title: (b.title as string).trim(),
      author: b.author?.trim() || null,
      ext: (b.ext || b.format || "epub").toLowerCase(),
      size: b.size || null,
      year: b.year || null,
      genre: b.genre || null,
      imgUrl: b.imgUrl || null,
      imgFallbackColor: b.imgFallbackColor || null,
      sources: Array.isArray(b.sources) ? b.sources : [],
    }));
}

/**
 * Resolve an md5 to a direct download URL via the RapidAPI /download endpoint,
 * which returns a JSON array of mirror links (first element is preferred).
 */
export async function getFastDownloadUrl(
  md5: string
): Promise<{ downloadUrl: string }> {
  const url = `https://${host()}/download?md5=${encodeURIComponent(md5)}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 429) {
    throw new Error("RapidAPI rate limit reached. Try again later.");
  }
  if (!res.ok) {
    throw new Error(`Download API failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as unknown;
  const links = Array.isArray(data)
    ? (data as string[])
    : (data as { download_url?: string }).download_url
    ? [(data as { download_url: string }).download_url]
    : [];

  const downloadUrl = links.find((l) => typeof l === "string" && l.length > 0);
  if (!downloadUrl) {
    throw new Error("No download link returned by the API.");
  }
  return { downloadUrl };
}
