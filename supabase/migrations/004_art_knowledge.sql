-- Art knowledge is server-owned. Browser roles must use the application API.
begin;

create or replace function artmind.knowledge_sources_valid(value jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb;
begin
  if jsonb_typeof(value) is distinct from 'array' or jsonb_array_length(value) < 1 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'title') is distinct from 'string' or (item->>'title') !~ '[^[:space:]]'
      or jsonb_typeof(item->'institution') is distinct from 'string' or (item->>'institution') !~ '[^[:space:]]'
      or jsonb_typeof(item->'url') is distinct from 'string' or (item->>'url') !~ '^https://[^[:space:]/]+/'
    then return false; end if;
  end loop;
  return true;
end $$;

create or replace function artmind.knowledge_portrait_valid(value jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare field text;
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) is distinct from 'object' then return false; end if;
  foreach field in array array['url', 'license', 'credit', 'sha256', 'objectKey'] loop
    if jsonb_typeof(value->field) is distinct from 'string' or (value->>field) !~ '[^[:space:]]' then return false; end if;
  end loop;
  if not artmind.knowledge_sources_valid(jsonb_build_array(value->'source'))
    or (value->>'url') !~ '^https://[^[:space:]/]+/'
    or (value->>'sha256') !~ '^[a-f0-9]{64}$'
    or (value->>'objectKey') !~ '^painters/[a-z0-9-]+\.webp$'
    or right(value->>'url', length('/Artmind/' || (value->>'objectKey'))) <> '/Artmind/' || (value->>'objectKey')
    or jsonb_typeof(value->'bytes') is distinct from 'number'
  then return false; end if;
  return (value->>'bytes')::numeric between 1 and 500000 and (value->>'bytes')::numeric = trunc((value->>'bytes')::numeric);
end $$;

create function artmind.knowledge_characteristics_valid(value text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select cardinality(value) between 3 and 5
    and not exists (select 1 from unnest(value) item where item is null or item !~ '[^[:space:]]');
$$;

create table artmind.knowledge_styles (
  id text primary key check (id ~ '^[A-Za-z][A-Za-z0-9_]*$'),
  english_name text not null check (english_name ~ '[^[:space:]]'),
  era text not null check (era ~ '[^[:space:]]'),
  summary text not null check (length(btrim(summary)) between 100 and 180),
  characteristics text[] not null check (artmind.knowledge_characteristics_valid(characteristics)),
  sources jsonb not null check (artmind.knowledge_sources_valid(sources)),
  verified_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table artmind.knowledge_painters (
  name text primary key check (name ~ '[^[:space:]]'),
  display_name text not null check (display_name ~ '[^[:space:]]'),
  style_id text not null references artmind.knowledge_styles(id) on update restrict on delete restrict,
  era text not null check (era ~ '[^[:space:]]'),
  bio text not null check (bio ~ '[^[:space:]]'),
  verified boolean not null,
  verification_note text not null check (verification_note ~ '[^[:space:]]'),
  sources jsonb not null check (artmind.knowledge_sources_valid(sources)),
  verified_at date not null,
  sort_order integer not null check (sort_order >= 0),
  portrait jsonb check (artmind.knowledge_portrait_valid(portrait)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table artmind.knowledge_style_painters (
  style_id text not null references artmind.knowledge_styles(id) on update restrict on delete restrict,
  painter_name text not null references artmind.knowledge_painters(name) on update restrict on delete restrict,
  sort_order integer not null check (sort_order >= 0),
  primary key (style_id, painter_name)
);

create function artmind.knowledge_guard_keys()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if tg_table_name = 'knowledge_styles' then
    if old.id is distinct from new.id then raise exception 'Knowledge style id is immutable'; end if;
  elsif tg_table_name = 'knowledge_painters' then
    if old.name is distinct from new.name then raise exception 'Knowledge painter name is immutable'; end if;
  end if;
  new.updated_at = now();
  return new;
end $$;

create trigger knowledge_styles_guard before update on artmind.knowledge_styles
for each row execute function artmind.knowledge_guard_keys();
create trigger knowledge_painters_guard before update on artmind.knowledge_painters
for each row execute function artmind.knowledge_guard_keys();

alter table artmind.knowledge_styles enable row level security;
alter table artmind.knowledge_painters enable row level security;
alter table artmind.knowledge_style_painters enable row level security;

revoke all on artmind.knowledge_styles, artmind.knowledge_painters, artmind.knowledge_style_painters from public, anon, authenticated;
grant select, insert, update, delete on artmind.knowledge_styles, artmind.knowledge_painters, artmind.knowledge_style_painters to service_role;

create function artmind.get_art_knowledge()
returns jsonb language sql stable security invoker set search_path = pg_catalog, artmind as $$
  select jsonb_build_object(
    'styles', coalesce((select jsonb_agg(to_jsonb(s) order by s.id) from artmind.knowledge_styles s), '[]'::jsonb),
    'painters', coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order, p.name) from artmind.knowledge_painters p), '[]'::jsonb),
    'representatives', coalesce((select jsonb_agg(to_jsonb(r) order by r.style_id, r.sort_order, r.painter_name) from artmind.knowledge_style_painters r), '[]'::jsonb)
  );
$$;

revoke all on function artmind.knowledge_sources_valid(jsonb), artmind.knowledge_portrait_valid(jsonb), artmind.knowledge_characteristics_valid(text[]), artmind.knowledge_guard_keys(), artmind.get_art_knowledge() from public, anon, authenticated;
grant execute on function artmind.knowledge_sources_valid(jsonb), artmind.knowledge_portrait_valid(jsonb), artmind.knowledge_characteristics_valid(text[]), artmind.knowledge_guard_keys(), artmind.get_art_knowledge() to service_role;

commit;

-- Read-only permissions acceptance (run after applying):
-- select role_name, table_name,
--   has_table_privilege(role_name, 'artmind.' || table_name, 'SELECT') as can_select,
--   has_table_privilege(role_name, 'artmind.' || table_name, 'INSERT,UPDATE,DELETE') as can_write
-- from unnest(array['anon','authenticated','service_role']) role_name
-- cross join unnest(array['knowledge_styles','knowledge_painters','knowledge_style_painters']) table_name;
-- select role_name, has_function_privilege(role_name, 'artmind.get_art_knowledge()', 'EXECUTE')
-- from unnest(array['anon','authenticated','service_role']) role_name;
