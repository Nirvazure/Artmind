import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  const filepath = path.join(UPLOAD_DIR, filename)
  await writeFile(filepath, buffer)
  return `/uploads/${filename}`
}
