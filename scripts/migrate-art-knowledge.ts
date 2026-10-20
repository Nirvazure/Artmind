import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { storageAdmin } from './lib/storage-admin.ts'
import {
  validateKnowledgeManifest,
  generateKnowledgeImportSql,
  compareKnowledgeManifests,
} from './lib/knowledge-migration.ts'

const args = process.argv.slice(2)
function argument(flag: string) {
  const index = args.indexOf(flag)
  if (index < 0) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${flag} needs a path`)
  return value
}

async function main() {
  const permitted = new Set(['--manifest', '--sql-out', '--verify'])
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (!permitted.has(arg)) throw new Error(`Unknown argument ${arg}`)
    if (arg !== '--verify') index++
  }
  const manifestPath = argument('--manifest')
  if (!manifestPath)
    throw new Error(
      'Usage: --manifest <external.json> [--sql-out .storage-migration/import.sql | --verify]',
    )
  const manifest = validateKnowledgeManifest(
    JSON.parse(readFileSync(resolve(manifestPath), 'utf8')),
  )
  const output = argument('--sql-out')
  if (output && args.includes('--verify')) throw new Error('Use --sql-out or --verify separately')
  console.log(
    `Manifest valid: ${manifest.styles.length} styles, ${manifest.painters.length} painters, ${manifest.representatives.length} representatives.`,
  )
  if (output) {
    const target = resolve(output)
    const root = resolve('.storage-migration')
    const pathFromRoot = relative(root, target)
    if (
      !pathFromRoot ||
      pathFromRoot.startsWith('..') ||
      isAbsolute(pathFromRoot) ||
      !target.endsWith('.sql')
    )
      throw new Error('--sql-out must be a .sql file inside ignored .storage-migration/')
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, generateKnowledgeImportSql(manifest), { flag: 'wx' })
    console.log(`Review and execute SQL manually: ${target}`)
  } else if (args.includes('--verify')) {
    const { client } = storageAdmin()
    const { data, error } = await client
      .rpc('get_art_knowledge')
      .abortSignal(AbortSignal.timeout(15000))
    if (error) throw new Error(`Cannot read artmind.get_art_knowledge: ${error.message}`)
    const differences = compareKnowledgeManifests(manifest, data)
    if (differences.length)
      throw new Error(`Database differs from manifest:\n${differences.join('\n')}`)
    console.log('Database matches manifest in every field; timestamps ignored.')
  } else {
    console.log('Preview only. No database or output files changed.')
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
