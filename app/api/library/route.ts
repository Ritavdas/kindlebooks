import { NextResponse } from "next/server";
import { listBooks } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ books: listBooks() });
}
