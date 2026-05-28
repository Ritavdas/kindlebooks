"use client";

import { useEffect, useState } from "react";

interface Book {
  md5: string;
  title: string;
  author: string | null;
  size_bytes: number | null;
  img_url: string | null;
  downloaded_at: string;
  sent_at: string | null;
}

type SendState = "idle" | "sending" | "error";

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [send, setSend] = useState<Record<string, SendState>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/library");
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function sendToKindle(md5: string) {
    setSend((s) => ({ ...s, [md5]: "sending" }));
    setMsg((s) => ({ ...s, [md5]: "" }));
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ md5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSend((s) => ({ ...s, [md5]: "idle" }));
      setBooks((bs) =>
        bs.map((b) => (b.md5 === md5 ? { ...b, sent_at: data.sent_at } : b))
      );
    } catch (err) {
      setSend((s) => ({ ...s, [md5]: "error" }));
      setMsg((s) => ({
        ...s,
        [md5]: err instanceof Error ? err.message : "Send failed",
      }));
    }
  }

  return (
    <div>
      <h1 className="page-title">Your Library</h1>
      <p className="page-lead">
        Everything you&apos;ve collected — beam any of it to your Kindle.
      </p>
      {loading && <div className="spinner">Loading…</div>}
      {!loading && books.length === 0 && (
        <div className="empty">No books yet. Download some from Search.</div>
      )}

      {books.map((b) => {
        const state = send[b.md5] || "idle";
        return (
          <div className="card" key={b.md5}>
            <div className="cover-wrap">
              {b.img_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="cover" src={b.img_url} alt={b.title} />
              ) : (
                <div className="cover cover-fallback">{b.title.slice(0, 1)}</div>
              )}
            </div>
            <div className="card-body">
              <div className="title">{b.title}</div>
              <div className="author">{b.author || "Unknown author"}</div>
              <div className="meta">
                <span className="tag">epub</span>
                {b.size_bytes && <span className="tag">{fmtSize(b.size_bytes)}</span>}
              </div>
            </div>
            <div className="actions">
              {b.sent_at ? (
                <span className="status-sent">Sent ✓</span>
              ) : null}
              <button
                onClick={() => sendToKindle(b.md5)}
                disabled={state === "sending"}
              >
                {state === "sending"
                  ? "Sending…"
                  : b.sent_at
                  ? "Send again"
                  : "Send to Kindle"}
              </button>
              {msg[b.md5] && (
                <span className="error" style={{ fontSize: 12 }}>
                  {msg[b.md5]}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
