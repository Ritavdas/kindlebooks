import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "kindlebooks.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      md5 TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      ext TEXT NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      size_bytes INTEGER,
      img_url TEXT,
      downloaded_at TEXT NOT NULL,
      sent_at TEXT
    );
  `);
  return db;
}

export function ensureLibraryDir(): string {
  const dir = path.resolve(process.cwd(), process.env.LIBRARY_DIR || "./library");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export interface BookRow {
  md5: string;
  title: string;
  author: string | null;
  ext: string;
  filename: string;
  path: string;
  size_bytes: number | null;
  img_url: string | null;
  downloaded_at: string;
  sent_at: string | null;
}

export function getBook(md5: string): BookRow | undefined {
  return getDb().prepare("SELECT * FROM books WHERE md5 = ?").get(md5) as
    | BookRow
    | undefined;
}

export function insertBook(row: BookRow): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO books
        (md5, title, author, ext, filename, path, size_bytes, img_url, downloaded_at, sent_at)
       VALUES (@md5, @title, @author, @ext, @filename, @path, @size_bytes, @img_url, @downloaded_at, @sent_at)`
    )
    .run(row);
}

export function markSent(md5: string, sentAt: string): void {
  getDb().prepare("UPDATE books SET sent_at = ? WHERE md5 = ?").run(sentAt, md5);
}

export function listBooks(): BookRow[] {
  return getDb()
    .prepare("SELECT * FROM books ORDER BY downloaded_at DESC")
    .all() as BookRow[];
}
