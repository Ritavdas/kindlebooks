import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindle Books",
  description: "Search, download EPUBs, and send to your Kindle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="brand">📚 Kindle Books</div>
          <nav className="nav">
            <Link href="/">Search</Link>
            <Link href="/library">Library</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
