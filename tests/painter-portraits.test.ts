import assert from 'node:assert/strict'
import test from 'node:test'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { compressPainterPortrait, portraitObjectKey } from '../scripts/lib/painter-portraits'

test('头像压缩产生不超过500000字节的WebP，保留完整肖像且移除元数据', async () => {
  const original = await sharp({
    create: { width: 1800, height: 2400, channels: 3, background: '#9b8463' },
  })
    .jpeg()
    .withMetadata()
    .toBuffer()
  const compressed = await compressPainterPortrait(original)
  const metadata = await sharp(compressed).metadata()
  assert.ok(compressed.length <= 500000)
  assert.equal(metadata.format, 'webp')
  assert.equal(metadata.width, 480)
  assert.equal(metadata.height, 640)
  assert.equal(metadata.exif, undefined)
})

test('头像对象路径包含内容指纹，重跑可复用且新图片不会覆盖旧图', () => {
  const first = portraitObjectKey('Example Painter', Buffer.from('first'))
  assert.match(first, /^painters\/example-painter-[a-f0-9]{16}\.webp$/)
  assert.equal(first, portraitObjectKey('Example Painter', Buffer.from('first')))
  assert.notEqual(first, portraitObjectKey('Example Painter', Buffer.from('second')))
  assert.throws(() => portraitObjectKey('../unsafe', Buffer.from('image')))
})

test('高细节大图也受500KB硬上限约束，非法图片不作为头像保存', async () => {
  const noisy = await sharp(randomBytes(1200 * 1600 * 3), {
    raw: { width: 1200, height: 1600, channels: 3 },
  })
    .png()
    .toBuffer()
  assert.ok(noisy.length > 500000)
  const compressed = await compressPainterPortrait(noisy)
  assert.ok(compressed.length <= 500000)
  await assert.rejects(compressPainterPortrait(Buffer.from('not an image')))
})
