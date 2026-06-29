import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient
  const config = useRuntimeConfig()
  const url =
    (config.public.supabase as { url?: string } | undefined)?.url ??
    process.env.SUPABASE_URL ??
    process.env.NUXT_PUBLIC_SUPABASE_URL ??
    ''
  const key = config.supabaseServiceRoleKey as string
  if (!url || !key) {
    throw new Error('Supabase admin not configured (SUPABASE_SERVICE_ROLE_KEY required)')
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'artmind' },
  })
  return adminClient
}
