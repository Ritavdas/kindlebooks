import { NextResponse } from "next/server";
import { getShelves } from "@/lib/shelves";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const shelves = await getShelves();
    return NextResponse.json({ shelves });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load shelves" },
      { status: 502 }
    );
  }
}
