"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

export default function HomeClient({
  initialShelves,
}: {
  initialShelves: Shelf[];
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [dl, setDl] = useState<Record<string, DlState>>({});
  const [dlMsg, setDlMsg] = useState<Record<string, string>>({});
  const [shelves] = useState<Shelf[]>(initialShelves);

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
  const trendingShelf = shelves[0];
  const featured = trendingShelf?.books?.[0] || null;
  const pillItems = marqueeItems.slice(0, 6);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const spot = document.getElementById("spotlight");
    const fw = document.getElementById("featureWrap");
    const feat = fw?.parentElement;
    function onMove(e: MouseEvent) {
      if (spot) {
        spot.style.setProperty("--x", `${e.clientX}px`);
        spot.style.setProperty("--y", `${e.clientY}px`);
      }
    }
    function onFeat(e: MouseEvent) {
      if (!fw || !feat) return;
      const r = feat.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      fw.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    }
    function onLeave() {
      if (fw) fw.style.transform = "";
    }
    window.addEventListener("mousemove", onMove);
    feat?.addEventListener("mousemove", onFeat);
    feat?.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      feat?.removeEventListener("mousemove", onFeat);
      feat?.removeEventListener("mouseleave", onLeave);
    };
  }, [featured]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );
    if (reduce) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const siblings = Array.from(el.parentElement?.children || []);
            const idx = siblings.indexOf(el);
            window.setTimeout(() => el.classList.add("in"), idx * 70);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shelves, results, searched, loading]);

  return (
    <div>
      {!searched && (
        <section className="hero">
          <div className="hero-copy">
            <div className="kicker cin c1">Search · Collect · Beam</div>
            <h1 className="hero-title cin c2">
              The whole written world,
              <br />
              <em>on one shelf.</em>
            </h1>
            <p className="hero-sub cin c3">
              Search a vast archive of EPUBs, curate your private library, and
              beam any title to your Kindle in a single tap.
            </p>

            <form className="search-bar cin c4" onSubmit={onSubmit}>
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

            {pillItems.length > 0 && (
              <div className="pills cin c5">
                {pillItems.map((b, i) => (
                  <span
                    className="pill"
                    key={i}
                    onClick={() => pickShelfBook(b)}
                  >
                    {b.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {featured && (
            <div className="feature cin c3">
              <div className="feature-wrap" id="featureWrap">
                <button
                  className={`featured${featured.coverUrl ? "" : " featured-fallback"}`}
                  onClick={() => pickShelfBook(featured)}
                  title={`${featured.title}${
                    featured.author ? " — " + featured.author : ""
                  }`}
                >
                  {featured.coverUrl && (
                    <Image
                      className="featured-img"
                      src={featured.coverUrl}
                      alt={featured.title}
                      fill
                      sizes="280px"
                      priority
                    />
                  )}
                  <span className="featured-tag">Trending now</span>
                  <span className="featured-beam" aria-hidden="true" />
                  <span className="featured-label">
                    <span className="featured-kind">Editor’s pick</span>
                    <span className="featured-title">{featured.title}</span>
                    {featured.author && (
                      <span className="featured-author">{featured.author}</span>
                    )}
                  </span>
                </button>
                <div className="feature-reflect" aria-hidden="true" />
              </div>
            </div>
          )}
        </section>
      )}

      {searched && (
        <form className="search-bar search-compact" onSubmit={onSubmit}>
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
      )}

      {error && <div className="error">{error}</div>}

      {!searched && !loading && (
        <div className="shelves">
          {shelves.length === 0 && (
            <div className="spinner">Curating your shelves…</div>
          )}
          {shelves.map((shelf, i) => (
            <section className="shelf" key={shelf.id}>
              <div className="section-head">
                <h2 className="shelf-title">
                  {shelf.title.replace(/^[^\p{L}\p{N}]+/u, "")}
                  <span className="num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </h2>
                <span className="section-hint">scroll →</span>
              </div>
              <div className="shelf-row">
                {shelf.books.map((b, i) => (
                  <button
                    className="shelf-card reveal"
                    key={`${shelf.id}-${i}`}
                    onClick={() => pickShelfBook(b)}
                    title={`${b.title}${b.author ? " — " + b.author : ""}`}
                  >
                    {b.coverUrl ? (
                      <Image
                        className="shelf-cover"
                        src={b.coverUrl}
                        alt={b.title}
                        width={150}
                        height={225}
                      />
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
              <div className="card reveal" key={r.md5}>
                <div className="cover-wrap">
                  {r.imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="cover"
                      src={r.imgUrl}
                      alt={r.title}
                      loading="lazy"
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
