import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KindleBeam — your personal book beam",
  description: "Search, collect, and beam EPUBs straight to your Kindle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-aurora" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <div className="bg-grain" aria-hidden="true" />

        <header className="header">
          <Link href="/" className="brand">
            <span className="brand-mark">&#10086;</span>
            <span className="brand-text">
              Kindle<span className="brand-accent">Beam</span>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/">Discover</Link>
            <Link href="/library">Library</Link>
            <span className="nav-status">
              <span className="dot" /> live
            </span>
          </nav>
        </header>

        <main className="main">{children}</main>

        <footer className="footer">
          <span>Beamed with &#10086; &mdash; your books, anywhere.</span>
        </footer>
      </body>
    </html>
  );
}
