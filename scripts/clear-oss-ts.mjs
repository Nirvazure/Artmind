#!/usr/bin/env node
/**
 * 构建前删除 ali-oss/lib 中的 .ts 文件，避免 Rollup 解析时报错
 * 参考: https://github.com/ali-sdk/ali-oss/issues/1241
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const libDir = path.join(__dirname, '../node_modules/ali-oss/lib')

if (!fs.existsSync(libDir)) {
  console.warn('[clear-oss-ts] ali-oss/lib not found, skipping')
  process.exit(0)
}

let count = 0
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      walk(full)
    } else if (name.endsWith('.ts')) {
      fs.unlinkSync(full)
      count++
    }
  }
}
walk(libDir)
console.log(`[clear-oss-ts] removed ${count} .ts file(s) from ali-oss/lib`)
