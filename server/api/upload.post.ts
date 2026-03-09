import { saveFile } from '../utils/storage'
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
  return { url }
})
