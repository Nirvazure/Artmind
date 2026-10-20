-- Converge installations that applied an earlier 004 while it was being reviewed.
-- Safe to rerun: no content changes. Entity identifiers stay immutable;
-- representative relationships remain editable by service_role.
begin;

create or replace function artmind.knowledge_sources_valid(value jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb;
begin
  if jsonb_typeof(value) is distinct from 'array' then return false; end if;
  if jsonb_array_length(value) < 1 then return false; end if;
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

create or replace function artmind.knowledge_characteristics_valid(value text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select cardinality(value) between 3 and 5
    and not exists (select 1 from unnest(value) item where item is null or item !~ '[^[:space:]]');
$$;

drop trigger if exists knowledge_representatives_guard on artmind.knowledge_style_painters;

create or replace function artmind.knowledge_guard_keys()
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

-- Re-add changed constraints so existing rows are checked against the final rules.
alter table artmind.knowledge_styles
  drop constraint if exists knowledge_styles_english_name_check,
  drop constraint if exists knowledge_styles_era_check,
  drop constraint if exists knowledge_styles_characteristics_check,
  drop constraint if exists knowledge_styles_sources_check,
  add constraint knowledge_styles_english_name_check check (english_name ~ '[^[:space:]]'),
  add constraint knowledge_styles_era_check check (era ~ '[^[:space:]]'),
  add constraint knowledge_styles_characteristics_check check (artmind.knowledge_characteristics_valid(characteristics)),
  add constraint knowledge_styles_sources_check check (artmind.knowledge_sources_valid(sources));

alter table artmind.knowledge_painters
  drop constraint if exists knowledge_painters_name_check,
  drop constraint if exists knowledge_painters_display_name_check,
  drop constraint if exists knowledge_painters_era_check,
  drop constraint if exists knowledge_painters_bio_check,
  drop constraint if exists knowledge_painters_verification_note_check,
  drop constraint if exists knowledge_painters_sources_check,
  drop constraint if exists knowledge_painters_portrait_check,
  add constraint knowledge_painters_name_check check (name ~ '[^[:space:]]'),
  add constraint knowledge_painters_display_name_check check (display_name ~ '[^[:space:]]'),
  add constraint knowledge_painters_era_check check (era ~ '[^[:space:]]'),
  add constraint knowledge_painters_bio_check check (bio ~ '[^[:space:]]'),
  add constraint knowledge_painters_verification_note_check check (verification_note ~ '[^[:space:]]'),
  add constraint knowledge_painters_sources_check check (artmind.knowledge_sources_valid(sources)),
  add constraint knowledge_painters_portrait_check check (artmind.knowledge_portrait_valid(portrait));

revoke all on function artmind.knowledge_sources_valid(jsonb), artmind.knowledge_portrait_valid(jsonb), artmind.knowledge_characteristics_valid(text[]), artmind.knowledge_guard_keys() from public, anon, authenticated;
grant execute on function artmind.knowledge_sources_valid(jsonb), artmind.knowledge_portrait_valid(jsonb), artmind.knowledge_characteristics_valid(text[]), artmind.knowledge_guard_keys() to service_role;

commit;
