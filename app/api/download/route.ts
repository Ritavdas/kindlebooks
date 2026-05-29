import { NextResponse } from "next/server";
import { getFastDownloadUrl } from "@/lib/anna";
import {
  getBook,
  insertBook,
  makeStoragePath,
  uploadBookFile,
} from "@/lib/db";

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

    const existing = await getBook(md5);
    if (existing) {
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

    const base = sanitize(`${title}${body.author ? " - " + body.author : ""}`);
    const filename = `${base}.epub`;
    const storagePath = makeStoragePath(md5, filename);

    const buffer = Buffer.from(await res.arrayBuffer());
    await uploadBookFile(storagePath, buffer);

    const row = {
      md5,
      title,
      author: body.author ?? null,
      ext: "epub",
      filename,
      path: storagePath,
      size_bytes: buffer.byteLength,
      img_url: body.imgUrl ?? null,
      downloaded_at: new Date().toISOString(),
      sent_at: null,
    };
    await insertBook(row);

    return NextResponse.json({ book: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download failed" },
      { status: 502 }
    );
  }
}
