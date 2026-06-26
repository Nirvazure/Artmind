import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export async function getUserIdFromToken(event: H3Event): Promise<string | null> {
  const cookieUser = await serverSupabaseUser(event)
  if (cookieUser?.id) return cookieUser.id

  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabase = await serverSupabaseClient(event)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user.id
}
