import { NextResponse } from "next/server";
import { sendToKindle } from "@/lib/mailer";
import { downloadBookFile, getBook, markSent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { md5 } = (await request.json()) as { md5?: string };
    if (!md5) {
      return NextResponse.json({ error: "Missing md5" }, { status: 400 });
    }

    const book = await getBook(md5);
    if (!book) {
      return NextResponse.json(
        { error: "Book not found in library" },
        { status: 404 }
      );
    }

    const content = await downloadBookFile(book.path);
    await sendToKindle({ content, filename: book.filename });

    const sentAt = new Date().toISOString();
    await markSent(md5, sentAt);

    return NextResponse.json({ ok: true, sent_at: sentAt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 502 }
    );
  }
}
