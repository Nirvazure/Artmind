import { saveFile } from '../utils/storage'
import { getUserIdFromToken } from '../utils/auth'
import { getSupabaseAdmin } from '../utils/supabase-admin'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = formData?.find((f) => f.name === 'file')
  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }
  const ext = file.filename?.split('.').pop() ?? 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const url = await saveFile(file.data, filename)

  const userId = await getUserIdFromToken(event)
  if (userId) {
    try {
      const supabase = getSupabaseAdmin()
      await supabase.from('uploads').insert({
        user_id: userId,
        temp_path: url,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      })
    } catch {
      // uploads 记录失败不影响上传
    }
  }

  return { url }
})
