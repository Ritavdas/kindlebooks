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
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,300;9..144,0,400;9..144,0,500;9..144,0,600;9..144,1,400&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="spotlight" id="spotlight" aria-hidden="true" />

        <header className="header">
          <HomeLink className="brand">
            <span className="brand-mark">K</span>
            <span className="brand-text">
              Kindle<span className="brand-accent">Beam</span>
            </span>
          </HomeLink>
          <nav className="nav">
            <HomeLink>Discover</HomeLink>
            <Link href="/library">Library</Link>
          </nav>
        </header>

        <main className="main">{children}</main>

        <footer className="footer">
          <span>Your books, anywhere.</span>
        </footer>
      </body>
    </html>
  );
}
