import type { Metadata } from "next";
import Link from "next/link";
import HomeLink from "./HomeLink";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "KindleBeam — your personal book beam",
  description:
    "Search millions of EPUBs, build your shelf, and beam them straight to your Kindle in one tap.",
  applicationName: "KindleBeam",
  openGraph: {
    type: "website",
    siteName: "KindleBeam",
    title: "KindleBeam — your personal book beam",
    description:
      "Search millions of EPUBs, build your shelf, and beam them straight to your Kindle in one tap.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "KindleBeam — your personal book beam",
    description:
      "Search millions of EPUBs, build your shelf, and beam them straight to your Kindle in one tap.",
  },
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
          <HomeLink className="brand">
            <span className="brand-mark">&#10086;</span>
            <span className="brand-text">
              Kindle<span className="brand-accent">Beam</span>
            </span>
          </HomeLink>
          <nav className="nav">
            <HomeLink>Discover</HomeLink>
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
