import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = process.env.SUPABASE_LIBRARY_BUCKET || "library";

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) return client;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return client;
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

export async function getBook(md5: string): Promise<BookRow | null> {
  const { data, error } = await getSupabase()
    .from("books")
    .select("*")
    .eq("md5", md5)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch book: ${error.message}`);
  return data as BookRow | null;
}

export async function insertBook(row: BookRow): Promise<void> {
  const { error } = await getSupabase().from("books").upsert(row, {
    onConflict: "md5",
  });

  if (error) throw new Error(`Failed to save book: ${error.message}`);
}

export async function markSent(md5: string, sentAt: string): Promise<void> {
  const { error } = await getSupabase()
    .from("books")
    .update({ sent_at: sentAt })
    .eq("md5", md5);

  if (error) throw new Error(`Failed to mark book as sent: ${error.message}`);
}

export async function listBooks(): Promise<BookRow[]> {
  const { data, error } = await getSupabase()
    .from("books")
    .select("*")
    .order("downloaded_at", { ascending: false });

  if (error) throw new Error(`Failed to list books: ${error.message}`);
  return (data || []) as BookRow[];
}

export function makeStoragePath(md5: string, filename: string): string {
  return `books/${md5}/${filename}`;
}

export async function uploadBookFile(path: string, content: Buffer): Promise<void> {
  const { error } = await getSupabase().storage
    .from(STORAGE_BUCKET)
    .upload(path, content, {
      contentType: "application/epub+zip",
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload EPUB: ${error.message}`);
}

export async function downloadBookFile(path: string): Promise<Buffer> {
  const { data, error } = await getSupabase().storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) throw new Error(`Failed to download EPUB from storage: ${error.message}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
