import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { getFastDownloadUrl } from "@/lib/anna";
import { ensureLibraryDir, insertBook, getBook } from "@/lib/db";

export const dynamic = "force-dynamic";

function sanitize(name: string): string {
  return name.replace(/[^\w\-. ]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 150);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      md5?: string;
      title?: string;
      author?: string | null;
      imgUrl?: string | null;
    };
    const { md5, title } = body;
    if (!md5 || !title) {
      return NextResponse.json({ error: "Missing md5 or title" }, { status: 400 });
    }

    const existing = getBook(md5);
    if (existing && fs.existsSync(existing.path)) {
      return NextResponse.json({ book: existing, alreadyDownloaded: true });
    }

    const { downloadUrl } = await getFastDownloadUrl(md5);

    const res = await fetch(downloadUrl);
    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: `Download failed: HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const dir = ensureLibraryDir();
    const base = sanitize(`${title}${body.author ? " - " + body.author : ""}`);
    const filename = `${base}.epub`;
    const filePath = path.join(dir, `${md5}-${filename}`);

    const fileStream = fs.createWriteStream(filePath);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));

    const size = fs.statSync(filePath).size;
    const row = {
      md5,
      title,
      author: body.author ?? null,
      ext: "epub",
      filename,
      path: filePath,
      size_bytes: size,
      img_url: body.imgUrl ?? null,
      downloaded_at: new Date().toISOString(),
      sent_at: null,
    };
    insertBook(row);

    return NextResponse.json({ book: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download failed" },
      { status: 502 }
    );
  }
}
