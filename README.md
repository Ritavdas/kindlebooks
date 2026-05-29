# Kindle Books

A web app to search Anna's Archive for EPUBs, save them to a private Supabase
library, and send them to your Kindle via email.

## Flow

1. **Search** a title/author → results filtered to EPUB.
2. **Download** → resolved via the RapidAPI Anna's Archive `/download` endpoint
   and uploaded to a private Supabase Storage bucket.
3. **Library → Send to Kindle** → downloads the stored EPUB from Supabase and
   emails it to your `@kindle.com` address.

Book metadata and sent status are tracked in Supabase Postgres.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Create Supabase resources

Create a Supabase project, then open **SQL Editor** and run:

```sql
-- supabase/schema.sql
create table if not exists public.books (
  md5 text primary key,
  title text not null,
  author text,
  ext text not null default 'epub',
  filename text not null,
  path text not null,
  size_bytes bigint,
  img_url text,
  downloaded_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists books_downloaded_at_idx
  on public.books (downloaded_at desc);

insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do update set public = excluded.public;

alter table public.books enable row level security;
```

This creates:

- `public.books` — metadata/history table.
- `library` — private Storage bucket for EPUB files.

The app uses the Supabase **service role key** server-side, so no public Storage
policies are needed.

### 3. Fill in `.env`

| Var | What it is |
| --- | --- |
| `RAPIDAPI_KEY` | Your RapidAPI key for the [Anna's Archive API](https://rapidapi.com/tribestick-tribestick-default/api/annas-archive-api). |
| `RAPIDAPI_HOST` | Default `annas-archive-api.p.rapidapi.com`. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. Keep this server-side only; do not expose it in client code. |
| `SUPABASE_LIBRARY_BUCKET` | Storage bucket name. Defaults to `library`. |
| `KINDLE_EMAIL` | Your personal Send-to-Kindle address, e.g. `yourname@kindle.com`. |
| `SENDER_EMAIL` | The Gmail address you send from. |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465`. |
| `SMTP_USER` / `SMTP_PASS` | Your Gmail address and a **Gmail App Password**. |
| `NYT_API_KEY` | Optional. Shows NYT Bestseller shelves on the homepage. |
| `NEXT_PUBLIC_SITE_URL` | Public URL used for link previews / OG images. |

### 4. Approve the sender in Amazon

In Amazon → *Manage Your Content and Devices → Preferences → Personal Document
Settings → Approved Personal Document E-mail List*, **add your `SENDER_EMAIL`**.
Amazon rejects documents from any address not on this list.

### 5. Gmail App Password

Enable 2-Step Verification on your Google account, then create an App Password
(Google Account → Security → App passwords) and use it as `SMTP_PASS`.

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

This version is Vercel-safe: it does not write to local disk. Supabase handles
both the database and the EPUB files.

Set the same `.env` values in **Vercel → Project → Settings → Environment
Variables**, then redeploy.

Important:

- Do **not** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.
- Supabase Storage free tier is fine for a personal EPUB library, but files count
  against your project storage quota.
- Keep `NEXT_PUBLIC_SITE_URL` set to your real public URL so shared-link previews
  point at the correct OG image.

## Notes & limitations

- **Search** and **download** both go through the RapidAPI Anna's Archive wrapper
  (`/search` and `/download`). No HTML scraping.
- Each result includes `title`, `author`, `md5`, `imgUrl` (thumbnail), `size`,
  `format`, `year`, `genre`, and `sources` — all of which are shown in the UI.
- The Anna's Archive **website** shows a "saves"/downloads count, but the
  RapidAPI wrapper does **not** return it, so it can't be displayed here.
- RapidAPI plans enforce **monthly request quotas / rate limits**; the app
  surfaces `429` errors when you hit them.
- Amazon sends **no delivery confirmation** — "Sent ✓" means your SMTP server
  accepted the message, not that the Kindle received it. Delivery usually takes a
  few minutes.
- Kindle email attachments are capped at **50 MB** (fine for EPUBs).
- EPUBs are natively supported by Send-to-Kindle; no MOBI conversion needed.

## Homepage recommendations

The homepage shows curated shelves so it isn't empty before you search:

- **Trending today** and genre shelves (Self-improvement, Science, Philosophy,
  Fantasy, Biographies) come from the free [Open Library](https://openlibrary.org)
  API — no key required.
- **NYT Bestseller** shelves appear only if you set `NYT_API_KEY`.

Click any cover to instantly search Anna's Archive for that title. Shelves are
cached in-memory for 6 hours.

## Project structure

```
app/
  page.tsx            Search UI
  library/page.tsx    Library + Send-to-Kindle UI
  api/search          GET  – RapidAPI /search (EPUB)
  api/download        POST – RapidAPI /download → Supabase Storage + Postgres
  api/send            POST – Supabase Storage EPUB → email to Kindle
  api/library         GET  – list saved books
  api/shelves         GET  – curated homepage shelves (Open Library + NYT)
lib/
  anna.ts             RapidAPI search + download client
  shelves.ts          Open Library / NYT recommendation shelves
  db.ts               Supabase Postgres + Storage helpers
  mailer.ts           nodemailer SMTP sender
supabase/
  schema.sql          table + private Storage bucket setup
```

## Legal

Anna's Archive aggregates files that may be copyrighted in your jurisdiction.
You are responsible for ensuring your use complies with applicable law.
