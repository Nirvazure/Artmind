-- style_corrections: AI vs user correction flywheel data

create table if not exists artmind.style_corrections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references artmind.profiles(id) on delete set null,
  artwork_id      uuid references artmind.artworks(id) on delete set null,
  image_url       text not null,
  ai_top_style    text not null,
  ai_styles       jsonb not null,
  user_style      text not null,
  ai_painters     jsonb not null,
  user_painters   jsonb not null,
  raw_labels      jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists style_corrections_created_at_idx
  on artmind.style_corrections(created_at desc);
create index if not exists style_corrections_ai_top_style_idx
  on artmind.style_corrections(ai_top_style);
create index if not exists style_corrections_user_style_idx
  on artmind.style_corrections(user_style);

alter table artmind.style_corrections enable row level security;

create policy "style_corrections_select_own" on artmind.style_corrections
  for select using (auth.uid() = user_id);

create policy "style_corrections_insert_own" on artmind.style_corrections
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "style_corrections_select_staff" on artmind.style_corrections
  for select using (
    exists (
      select 1 from artmind.profiles p
      where p.id = auth.uid() and p.role in ('moderator', 'admin')
    )
  );

grant all on artmind.style_corrections to postgres, anon, authenticated, service_role;
