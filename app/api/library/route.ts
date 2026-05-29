import { NextResponse } from "next/server";
import { listBooks } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ books: await listBooks() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list books" },
      { status: 500 }
    );
  }
}
