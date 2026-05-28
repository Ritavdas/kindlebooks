export interface ShelfBook {
  title: string;
  author: string | null;
  coverUrl: string | null;
  query: string;
}

export interface Shelf {
  id: string;
  title: string;
  books: ShelfBook[];
}

const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const cache = new Map<string, { at: number; data: Shelf[] }>();

function olCover(id: number | undefined | null): string | null {
  return id ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : null;
}

interface OlWork {
  title?: string;
  author_name?: string[];
  authors?: { name?: string }[];
  cover_i?: number;
  cover_id?: number;
}

function mapWork(w: OlWork): ShelfBook | null {
  if (!w.title) return null;
  const author =
    w.author_name?.[0] || w.authors?.[0]?.name || null;
  return {
    title: w.title.trim(),
    author: author?.trim() || null,
    coverUrl: olCover(w.cover_i ?? w.cover_id),
    query: author ? `${w.title} ${author}` : w.title,
  };
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "KindleBooks/1.0 (personal use)" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function trendingShelf(): Promise<Shelf | null> {
  const data = await fetchJson(
    "https://openlibrary.org/trending/daily.json?limit=18"
  );
  const works: OlWork[] = data?.works ?? [];
  const books = works.map(mapWork).filter((b): b is ShelfBook => !!b);
  if (!books.length) return null;
  return { id: "trending", title: "🔥 Trending today", books };
}

const SUBJECTS: { id: string; title: string; subject: string }[] = [
  { id: "self_help", title: "🧠 Self-improvement", subject: "self-help" },
  { id: "science", title: "🔬 Science", subject: "science" },
  { id: "philosophy", title: "📜 Philosophy", subject: "philosophy" },
  { id: "fantasy", title: "🐉 Fantasy", subject: "fantasy" },
  { id: "biography", title: "👤 Biographies", subject: "biography" },
];

async function subjectShelf(s: {
  id: string;
  title: string;
  subject: string;
}): Promise<Shelf | null> {
  const data = await fetchJson(
    `https://openlibrary.org/subjects/${encodeURIComponent(
      s.subject
    )}.json?limit=14`
  );
  const works: OlWork[] = data?.works ?? [];
  const books = works.map(mapWork).filter((b): b is ShelfBook => !!b);
  if (!books.length) return null;
  return { id: s.id, title: s.title, books };
}

async function nytShelves(): Promise<Shelf[]> {
  const key = process.env.NYT_API_KEY;
  if (!key) return [];
  const lists: { id: string; title: string; list: string }[] = [
    {
      id: "nyt_fiction",
      title: "🏆 NYT Bestsellers — Fiction",
      list: "combined-print-and-e-book-fiction",
    },
    {
      id: "nyt_nonfiction",
      title: "🏆 NYT Bestsellers — Nonfiction",
      list: "combined-print-and-e-book-nonfiction",
    },
  ];

  const out: Shelf[] = [];
  for (const l of lists) {
    const data = await fetchJson(
      `https://api.nytimes.com/svc/books/v3/lists/current/${l.list}.json?api-key=${key}`
    );
    const items: any[] = data?.results?.books ?? [];
    const books: ShelfBook[] = items
      .filter((b) => b.title)
      .map((b) => ({
        title: String(b.title).trim(),
        author: b.author?.trim() || null,
        coverUrl: b.book_image || null,
        query: b.author ? `${b.title} ${b.author}` : b.title,
      }));
    if (books.length) out.push({ id: l.id, title: l.title, books });
  }
  return out;
}

export async function getShelves(): Promise<Shelf[]> {
  const hit = cache.get("shelves");
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  const results = await Promise.all([
    nytShelves(),
    trendingShelf(),
    ...SUBJECTS.map(subjectShelf),
  ]);

  const shelves: Shelf[] = [];
  for (const r of results) {
    if (Array.isArray(r)) shelves.push(...r);
    else if (r) shelves.push(r);
  }

  cache.set("shelves", { at: Date.now(), data: shelves });
  return shelves;
}
