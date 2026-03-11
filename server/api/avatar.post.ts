import { getUserIdFromToken } from '../utils/auth'
import { saveFile } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromToken(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const formData = await readMultipartFormData(event)
  const file = formData?.find((f) => f.name === 'file')
  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const ext = file.filename?.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const filename = `${userId}.${safeExt}`
  const url = await saveFile(
    Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data),
    filename,
    'avatars'
  )
  return { url }
})
