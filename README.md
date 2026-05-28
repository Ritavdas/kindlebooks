# Kindle Books

A local web app to search Anna's Archive for EPUBs, download them to a local
library, and send them to your Kindle via email — all from your browser.

## Flow

1. **Search** a title/author → results filtered to EPUB.
2. **Download** → resolved via the RapidAPI Anna's Archive `/download` endpoint and saved into `./library`.
3. **Library → Send to Kindle** → emails the EPUB to your `@kindle.com` address.

Downloads and sent status are tracked in a local SQLite DB (`kindlebooks.db`).

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Fill in `.env`

| Var | What it is |
| --- | --- |
| `RAPIDAPI_KEY` | Your RapidAPI key for the [Anna's Archive API](https://rapidapi.com/tribestick-tribestick-default/api/annas-archive-api) (from the RapidAPI dashboard). |
| `RAPIDAPI_HOST` | Default `annas-archive-api.p.rapidapi.com`. |
| `KINDLE_EMAIL` | Your personal Send-to-Kindle address, e.g. `yourname@kindle.com`. Find it in Amazon → *Manage Your Content and Devices → Preferences → Personal Document Settings*. |
| `SENDER_EMAIL` | The Gmail address you send from. |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465`. |
| `SMTP_USER` / `SMTP_PASS` | Your Gmail address and a **Gmail App Password** (not your normal password). |

### 3. Approve the sender in Amazon

In Amazon → *Manage Your Content and Devices → Preferences → Personal Document
Settings → Approved Personal Document E-mail List*, **add your `SENDER_EMAIL`**.
Amazon rejects documents from any address not on this list.

### 4. Gmail App Password

Enable 2-Step Verification on your Google account, then create an App Password
(Google Account → Security → App passwords) and use it as `SMTP_PASS`.

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Notes & limitations

- **Search** and **download** both go through the RapidAPI Anna's Archive
  wrapper (`/search` and `/download`). No HTML scraping. Each result includes
  `title`, `author`, `md5`, `imgUrl` (thumbnail), `size`, `format`, `year`,
  `genre`, and `sources` — all of which are shown in the UI.
- The Anna's Archive **website** shows a "saves"/downloads count, but the
  RapidAPI wrapper does **not** return it, so it can't be displayed here.
- RapidAPI plans enforce **monthly request quotas / rate limits**; the app
  surfaces `429` errors when you hit them.
- Amazon sends **no delivery confirmation** — "Sent ✓" means your SMTP server
  accepted the message, not that the Kindle received it. Delivery usually takes a
  few minutes.
- Kindle email attachments are capped at **50 MB** (fine for EPUBs).
- EPUBs are now natively supported by Send-to-Kindle; no MOBI conversion needed.

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
  api/download        POST – RapidAPI /download → ./library + DB
  api/send            POST – email EPUB to Kindle
  api/library         GET  – list downloaded books
  api/shelves         GET  – curated homepage shelves (Open Library + NYT)
lib/
  anna.ts             RapidAPI search + download client
  shelves.ts          Open Library / NYT recommendation shelves
  db.ts               SQLite (better-sqlite3)
  mailer.ts           nodemailer (Gmail SMTP)
```

## Legal

Anna's Archive aggregates files that may be copyrighted in your jurisdiction.
You are responsible for ensuring your use complies with applicable law.
