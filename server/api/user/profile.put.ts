import { ManagementClient } from 'authing-js-sdk'
import { getUserIdFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromToken(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<{ photo?: string; nickname?: string }>(event)
  if (!body || (body.photo === undefined && body.nickname === undefined)) {
    throw createError({ statusCode: 400, message: 'No updates provided' })
  }

  const config = useRuntimeConfig()
  const userPoolId = config.authingUserPoolId as string
  const secret = config.authingSecret as string
  if (!userPoolId || !secret) {
    throw createError({
      statusCode: 503,
      message: 'Authing Management API 未配置，请在 .env 添加 AUTHING_SECRET（用户池密钥）',
    })
  }

  const client = new ManagementClient({
    userPoolId,
    secret,
  })

  const updates: { photo?: string; nickname?: string } = {}
  if (body.photo !== undefined) updates.photo = body.photo
  if (body.nickname !== undefined) updates.nickname = body.nickname

  await client.users.update(userId, updates)
  return { ok: true }
})
