"use client";

import { useEffect, useState } from "react";
import { HOME_RESET_EVENT } from "./constants";

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

interface ShelfBook {
  title: string;
  author: string | null;
  coverUrl: string | null;
  query: string;
}

interface Shelf {
  id: string;
  title: string;
  books: ShelfBook[];
}

type DlState = "idle" | "downloading" | "done" | "error";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [dl, setDl] = useState<Record<string, DlState>>({});
  const [dlMsg, setDlMsg] = useState<Record<string, string>>({});
  const [shelves, setShelves] = useState<Shelf[]>([]);

  useEffect(() => {
    fetch("/api/shelves")
      .then((r) => r.json())
      .then((d) => setShelves(d.shelves || []))
      .catch(() => {});
  }, []);

  function resetToHome() {
    setQuery("");
    setResults([]);
    setError(null);
    setSearched(false);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    window.addEventListener(HOME_RESET_EVENT, resetToHome);
    return () => window.removeEventListener(HOME_RESET_EVENT, resetToHome);
  }, []);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function pickShelfBook(b: ShelfBook) {
    setQuery(b.query);
    runSearch(b.query);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const marqueeItems = shelves.flatMap((s) => s.books).slice(0, 18);

  return (
    <div>
      <section className="hero">
        <span className="eyebrow">❦ search · collect · beam</span>
        <h1 className="hero-title">
          Every book you crave,
          <br />
          <em>beamed to your Kindle.</em>
        </h1>
        <p className="hero-sub">
          Search a vast archive of EPUBs, build your private library, and send
          any title to your Kindle in one tap.
        </p>

        <form className="search-bar" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Search a title, author or ISBN…"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              if (v.trim() === "") resetToHome();
            }}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {!searched && marqueeItems.length > 0 && (
          <div className="marquee">
            <div className="marquee-track">
              {[...marqueeItems, ...marqueeItems].map((b, i) => (
                <span
                  className="marquee-pill"
                  key={i}
                  onClick={() => pickShelfBook(b)}
                >
                  {b.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      {!searched && !loading && (
        <div className="shelves">
          {shelves.length === 0 && (
            <div className="spinner">Curating your shelves…</div>
          )}
          {shelves.map((shelf) => (
            <section className="shelf" key={shelf.id}>
              <div className="section-head">
                <h2 className="shelf-title">{shelf.title}</h2>
                <span className="section-hint">scroll →</span>
              </div>
              <div className="shelf-row">
                {shelf.books.map((b, i) => (
                  <button
                    className="shelf-card"
                    key={`${shelf.id}-${i}`}
                    onClick={() => pickShelfBook(b)}
                    title={`${b.title}${b.author ? " — " + b.author : ""}`}
                  >
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="shelf-cover" src={b.coverUrl} alt={b.title} />
                    ) : (
                      <div className="shelf-cover shelf-cover-fallback">
                        {b.title.slice(0, 1)}
                      </div>
                    )}
                    <div className="shelf-book-title">{b.title}</div>
                    {b.author && (
                      <div className="shelf-book-author">{b.author}</div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {loading && <div className="spinner">Scanning the archive…</div>}

      {searched && !loading && !error && results.length === 0 && (
        <div className="empty">No EPUBs found. Try another title.</div>
      )}

      {searched && results.length > 0 && (
        <div className="results">
          <h2 className="results-head">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
          </h2>
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
      )}
    </div>
  );
}
