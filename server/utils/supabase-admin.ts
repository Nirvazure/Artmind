import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

type AdminClient = SupabaseClient<Database, 'artmind'>

let adminClient: AdminClient | null = null

export function getSupabaseAdmin(): AdminClient {
  if (adminClient) return adminClient
  const config = useRuntimeConfig()
  const url =
    (config.public.supabase as { url?: string } | undefined)?.url ??
    process.env.SUPABASE_URL ??
    process.env.NUXT_PUBLIC_SUPABASE_URL ??
    ''
  const key =
    (config.supabaseSecretKey as string | undefined)?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim()
  if (!url || !key) {
    throw new Error('Supabase admin not configured (SUPABASE_URL and SUPABASE_SECRET_KEY required)')
  }
  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'artmind' },
  })
  return adminClient
}
