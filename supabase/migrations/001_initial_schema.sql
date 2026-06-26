-- ArtMind initial schema on YQYHub: artmind.profiles, artworks, likes, uploads, analysis_logs

create schema if not exists artmind;
grant usage on schema artmind to postgres, anon, authenticated, service_role;
grant all on all tables in schema artmind to postgres, anon, authenticated, service_role;
alter default privileges in schema artmind grant all on tables to anon, authenticated, service_role;

create type artmind.user_role as enum ('user', 'moderator', 'admin');
create type artmind.artwork_status as enum ('draft', 'pending', 'published', 'rejected');

create table artmind.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  role         artmind.user_role not null default 'user',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table artmind.artworks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references artmind.profiles(id) on delete cascade,
  title           text not null,
  style           text not null,
  image_url       text not null,
  image_width     int,
  image_height    int,
  is_public       boolean not null default true,
  status          artmind.artwork_status not null default 'published',
  analysis_result jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index artworks_user_id_idx on artmind.artworks(user_id);
create index artworks_created_at_idx on artmind.artworks(created_at desc);

create table artmind.artwork_likes (
  artwork_id uuid not null references artmind.artworks(id) on delete cascade,
  user_id    uuid not null references artmind.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (artwork_id, user_id)
);

create table artmind.uploads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references artmind.profiles(id) on delete set null,
  temp_path   text not null,
  expires_at  timestamptz not null,
  saved       boolean not null default false,
  created_at  timestamptz not null default now()
);

create table artmind.analysis_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references artmind.profiles(id) on delete set null,
  upload_id       uuid references artmind.uploads(id) on delete set null,
  image_url       text not null,
  analysis_result jsonb not null,
  created_at      timestamptz not null default now()
);

-- RLS
alter table artmind.profiles enable row level security;
alter table artmind.artworks enable row level security;
alter table artmind.artwork_likes enable row level security;
alter table artmind.uploads enable row level security;
alter table artmind.analysis_logs enable row level security;

create policy "profiles_select_all" on artmind.profiles
  for select using (true);

create policy "profiles_update_own" on artmind.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on artmind.profiles
  for insert with check (auth.uid() = id);

create policy "artworks_select_public" on artmind.artworks
  for select using (
    (is_public and status = 'published')
    or auth.uid() = user_id
    or exists (
      select 1 from artmind.profiles p
      where p.id = auth.uid() and p.role in ('moderator', 'admin')
    )
  );

create policy "artworks_insert_own" on artmind.artworks
  for insert with check (auth.uid() = user_id);

create policy "artworks_update_own" on artmind.artworks
  for update using (auth.uid() = user_id);

create policy "artworks_delete_own" on artmind.artworks
  for delete using (auth.uid() = user_id);

create policy "likes_select_all" on artmind.artwork_likes
  for select using (true);

create policy "likes_insert_own" on artmind.artwork_likes
  for insert with check (auth.uid() = user_id);

create policy "likes_delete_own" on artmind.artwork_likes
  for delete using (auth.uid() = user_id);

create policy "uploads_select_own" on artmind.uploads
  for select using (auth.uid() = user_id);

create policy "uploads_insert_own" on artmind.uploads
  for insert with check (auth.uid() = user_id);

create policy "uploads_update_own" on artmind.uploads
  for update using (auth.uid() = user_id);

create policy "analysis_logs_select_own" on artmind.analysis_logs
  for select using (auth.uid() = user_id);

create policy "analysis_logs_insert_own" on artmind.analysis_logs
  for insert with check (auth.uid() = user_id or user_id is null);

-- Auto-create profile on signup (GitHub OAuth metadata)
create or replace function artmind.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = artmind
as $$
begin
  insert into artmind.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1),
      '用户'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;

create trigger artmind_on_auth_user_created
  after insert on auth.users
  for each row execute function artmind.handle_new_user();

-- updated_at trigger
create or replace function artmind.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on artmind.profiles
  for each row execute function artmind.set_updated_at();

create trigger artworks_updated_at
  before update on artmind.artworks
  for each row execute function artmind.set_updated_at();
