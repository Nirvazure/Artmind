import { isDeepStrictEqual } from 'node:util'

export interface KnowledgeManifest {
  styles: Array<Record<string, unknown>>
  painters: Array<Record<string, unknown>>
  representatives: Array<Record<string, unknown>>
}

const fields = {
  styles: ['id', 'english_name', 'era', 'summary', 'characteristics', 'sources', 'verified_at'],
  painters: [
    'name',
    'display_name',
    'style_id',
    'era',
    'bio',
    'verified',
    'verification_note',
    'sources',
    'verified_at',
    'sort_order',
    'portrait',
  ],
  representatives: ['style_id', 'painter_name', 'sort_order'],
} as const

function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\u0000'))
    throw new Error(`${label} must be nonempty text without null characters`)
}

function sources(value: unknown, label: string) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must contain sources`)
  for (const source of value) {
    if (!source || typeof source !== 'object') throw new Error(`${label}: invalid source`)
    for (const key of ['title', 'institution', 'url']) text(source[key], `${label}.${key}`)
    const url = new URL(source.url)
    if (url.protocol !== 'https:') throw new Error(`${label}: HTTPS source required`)
  }
}

function date(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new Error('Invalid verified_at date')
}

export function validateKnowledgeManifest(input: unknown): KnowledgeManifest {
  if (!input || typeof input !== 'object') throw new Error('Manifest must be an object')
  const manifest = input as KnowledgeManifest
  for (const group of Object.keys(fields) as Array<keyof KnowledgeManifest>) {
    if (!Array.isArray(manifest[group]) || !manifest[group].length)
      throw new Error(`Manifest ${group} must be a nonempty array`)
    for (const row of manifest[group]) {
      if (!row || typeof row !== 'object' || Array.isArray(row))
        throw new Error(`Invalid ${group} row`)
      const keys = Object.keys(row)
      if (
        keys.some((key) => !(fields[group] as readonly string[]).includes(key)) ||
        fields[group].some((key) => !(key in row))
      )
        throw new Error(`Unexpected or missing fields in ${group}`)
    }
  }
  const styles = new Set<string>()
  for (const row of manifest.styles) {
    for (const key of ['id', 'english_name', 'era', 'summary']) text(row[key], key)
    const id = row.id as string
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(id) || styles.has(id))
      throw new Error('Invalid or duplicate style id')
    styles.add(id)
    if (
      [...(row.summary as string).trim()].length < 100 ||
      [...(row.summary as string).trim()].length > 180
    )
      throw new Error('Style summary must be 100–180 characters')
    if (
      !Array.isArray(row.characteristics) ||
      row.characteristics.length < 3 ||
      row.characteristics.length > 5
    )
      throw new Error('Style needs 3–5 characteristics')
    row.characteristics.forEach((value) => text(value, 'characteristic'))
    sources(row.sources, 'style.sources')
    date(row.verified_at)
  }
  const painters = new Set<string>()
  for (const row of manifest.painters) {
    for (const key of ['name', 'display_name', 'style_id', 'era', 'bio', 'verification_note'])
      text(row[key], key)
    if (painters.has(row.name as string) || !styles.has(row.style_id as string))
      throw new Error('Duplicate painter or unknown style')
    painters.add(row.name as string)
    if (typeof row.verified !== 'boolean') throw new Error('verified must be boolean')
    if (
      !Number.isInteger(row.sort_order) ||
      (row.sort_order as number) < 0 ||
      (row.sort_order as number) > 2147483647
    )
      throw new Error('Invalid painter sort_order')
    sources(row.sources, 'painter.sources')
    date(row.verified_at)
    if (row.portrait !== null) {
      const portrait = row.portrait as Record<string, unknown>
      if (!portrait || typeof portrait !== 'object' || Array.isArray(portrait))
        throw new Error('Invalid portrait')
      for (const key of ['url', 'license', 'credit', 'sha256', 'objectKey'])
        text(portrait[key], `portrait.${key}`)
      sources([portrait.source], 'portrait.source')
      if (
        new URL(portrait.url as string).protocol !== 'https:' ||
        !/^[a-f0-9]{64}$/.test(portrait.sha256 as string) ||
        !/^painters\/[a-z0-9-]+\.webp$/.test(portrait.objectKey as string) ||
        !(portrait.url as string).endsWith(`/Artmind/${portrait.objectKey}`) ||
        !Number.isInteger(portrait.bytes) ||
        (portrait.bytes as number) < 1 ||
        (portrait.bytes as number) > 500000
      )
        throw new Error('Invalid portrait upload metadata')
    }
  }
  const relations = new Set<string>()
  for (const row of manifest.representatives) {
    if (
      !styles.has(row.style_id as string) ||
      !painters.has(row.painter_name as string) ||
      !Number.isInteger(row.sort_order) ||
      (row.sort_order as number) < 0 ||
      (row.sort_order as number) > 2147483647
    )
      throw new Error('Invalid representative reference or order')
    const key = JSON.stringify([row.style_id, row.painter_name])
    if (relations.has(key)) throw new Error('Duplicate representative')
    relations.add(key)
  }
  return manifest
}

/** A PostgreSQL dollar quote whose delimiter cannot occur in the payload. */
export function sqlJson(value: unknown): string {
  const json = JSON.stringify(value)
  let tag = '$knowledge$'
  while (json.includes(tag)) tag = tag.slice(0, -1) + '_$'
  return `${tag}${json}${tag}::jsonb`
}

export function generateKnowledgeImportSql(input: unknown): string {
  const manifest = validateKnowledgeManifest(input)
  const groups = [
    ['styles', 'knowledge_styles', 'id'],
    ['painters', 'knowledge_painters', 'name'],
    ['representatives', 'knowledge_style_painters', 'style_id,painter_name'],
  ] as const
  const statements = groups.map(([group, table, key]) => {
    const columns = fields[group].join(', ')
    const casts = fields[group]
      .map(
        (column) =>
          `${column} ${column === 'sources' || column === 'portrait' ? 'jsonb' : column === 'characteristics' ? 'text[]' : column === 'verified' ? 'boolean' : column === 'verified_at' ? 'date' : column === 'sort_order' ? 'integer' : 'text'}`,
      )
      .join(', ')
    const match = key
      .split(',')
      .map((column) => `actual.${column} = expected.${column}`)
      .join(' and ')
    const payload = sqlJson(manifest[group])
    let assertionTag = '$assert$'
    while (payload.includes(assertionTag)) assertionTag = assertionTag.slice(0, -1) + '_$'
    return `insert into artmind.${table} (${columns})\nselect ${columns} from jsonb_to_recordset(${payload}) as incoming(${casts})\non conflict (${key}) do nothing;\n\ndo ${assertionTag}\nbegin\n  if exists (\n    select 1 from jsonb_to_recordset(${payload}) as expected(${casts})\n    left join artmind.${table} actual on ${match}\n    where actual.${key.split(',')[0]} is null or (to_jsonb(actual) - 'created_at' - 'updated_at') is distinct from to_jsonb(expected)\n  ) then raise exception 'Existing ${table} differs from manifest; transaction aborted'; end if;\nend ${assertionTag};`
  })
  return `-- Generated from an external manifest; review before running in Supabase SQL Editor.\n-- Identical existing rows are accepted. Conflicting content aborts the whole transaction.\nbegin;\nlock table artmind.knowledge_styles, artmind.knowledge_painters, artmind.knowledge_style_painters in share row exclusive mode;\n\n${statements.join('\n\n')}\n\ncommit;\n`
}

export function compareKnowledgeManifests(expectedInput: unknown, actualInput: unknown): string[] {
  const expected = validateKnowledgeManifest(expectedInput)
  if (!actualInput || typeof actualInput !== 'object')
    return ['RPC did not return a manifest object']
  const actual = actualInput as KnowledgeManifest
  const differences: string[] = []
  for (const group of Object.keys(fields) as Array<keyof KnowledgeManifest>) {
    if (!Array.isArray(actual[group])) {
      differences.push(`${group}: missing array`)
      continue
    }
    const identity = (row: Record<string, unknown>) =>
      group === 'styles'
        ? String(row.id)
        : group === 'painters'
          ? String(row.name)
          : JSON.stringify([row.style_id, row.painter_name])
    const rows = new Map(actual[group].map((row) => [identity(row), row]))
    if (rows.size !== actual[group].length) differences.push(`${group}: duplicate keys`)
    if (actual[group].length !== expected[group].length)
      differences.push(
        `${group}: expected ${expected[group].length} rows, received ${actual[group].length}`,
      )
    for (const row of expected[group]) {
      const key = identity(row)
      const found = rows.get(key)
      if (!found) {
        differences.push(`${group}.${key}: missing`)
        continue
      }
      for (const field of fields[group])
        if (!isDeepStrictEqual(row[field], found[field]))
          differences.push(`${group}.${key}.${field}: differs`)
    }
  }
  return differences
}
