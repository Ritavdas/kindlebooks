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

alter table public.books enable row level security;

insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do update set public = excluded.public;
