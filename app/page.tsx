"use client";

import { useState } from "react";

interface SearchResult {
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

type DlState = "idle" | "downloading" | "done" | "error";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dl, setDl] = useState<Record<string, DlState>>({});
  const [dlMsg, setDlMsg] = useState<Record<string, string>>({});

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function download(r: SearchResult) {
    setDl((s) => ({ ...s, [r.md5]: "downloading" }));
    setDlMsg((s) => ({ ...s, [r.md5]: "" }));
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          md5: r.md5,
          title: r.title,
          author: r.author,
          imgUrl: r.imgUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      setDl((s) => ({ ...s, [r.md5]: "done" }));
      setDlMsg((s) => ({
        ...s,
        [r.md5]: data.alreadyDownloaded ? "Already in library" : "Saved to library",
      }));
    } catch (err) {
      setDl((s) => ({ ...s, [r.md5]: "error" }));
      setDlMsg((s) => ({
        ...s,
        [r.md5]: err instanceof Error ? err.message : "Download failed",
      }));
    }
  }

  return (
    <div>
      <h1>Search Anna&apos;s Archive (EPUB)</h1>
      <form className="search-bar" onSubmit={runSearch}>
        <input
          type="text"
          placeholder="Title, author, ISBN…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {!loading && !error && results.length === 0 && (
        <div className="empty">Search for a book to get started.</div>
      )}

      {results.map((r) => {
        const state = dl[r.md5] || "idle";
        return (
          <div className="card" key={r.md5}>
            <div className="cover-wrap">
              {r.imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="cover"
                  src={r.imgUrl}
                  alt={r.title}
                  style={{ background: r.imgFallbackColor || "#20242d" }}
                />
              ) : (
                <div
                  className="cover cover-fallback"
                  style={{ background: r.imgFallbackColor || "#20242d" }}
                >
                  {r.title.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="title">{r.title}</div>
              <div className="author">{r.author || "Unknown author"}</div>
              <div className="meta">
                <span className="tag">{r.ext}</span>
                {r.size && <span className="tag">{r.size}</span>}
                {r.year && <span className="tag">{r.year}</span>}
                {r.genre && <span className="tag">{r.genre}</span>}
                {r.sources.map((s) => (
                  <span className="tag tag-src" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="actions">
              <button
                onClick={() => download(r)}
                disabled={state === "downloading" || state === "done"}
              >
                {state === "downloading"
                  ? "Downloading…"
                  : state === "done"
                  ? "Downloaded ✓"
                  : "Download"}
              </button>
              {dlMsg[r.md5] && (
                <span
                  className={state === "error" ? "error" : "muted"}
                  style={{ fontSize: 12 }}
                >
                  {dlMsg[r.md5]}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
