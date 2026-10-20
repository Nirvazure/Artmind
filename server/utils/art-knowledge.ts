import type { H3Event } from 'h3'
import { getSupabaseAdmin } from './supabase-admin'
import { createKnowledgeCache, mapKnowledgeRows } from './knowledge-core'

export const getArtKnowledge = createKnowledgeCache(async () => {
  const { data, error } = await getSupabaseAdmin()
    .rpc('get_art_knowledge')
    .abortSignal(AbortSignal.timeout(5000))
  if (error) throw Error(`Knowledge database read failed: ${error.code}`)
  return mapKnowledgeRows(data)
})

export async function knowledgeForRequest(event: H3Event) {
  try {
    const result = await getArtKnowledge()
    setHeader(event, 'X-Art-Knowledge-State', result.state)
    setHeader(event, 'X-Art-Knowledge-Fetched-At', new Date(result.fetchedAt).toISOString())
    setHeader(event, 'Cache-Control', 'no-store')
    return result.data
  } catch (error) {
    console.warn(
      '[art-knowledge] Read unavailable',
      error instanceof Error ? error.message : 'unknown',
    )
    throw createError({ statusCode: 503, message: '知识资料暂不可用，请稍后重试' })
  }
}
