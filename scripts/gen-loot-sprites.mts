/**
 * Loot artifact-image farm — generates icons for relic/legendary/mythic
 * loot via OpenRouter (openai/gpt-5.4-image-2) into public/images/loot.
 * Idempotent (skips existing). Lower rarities use the slot-glyph fallback.
 *
 *   OPENROUTER_API_KEY=... npx tsx scripts/gen-loot-sprites.mts [concurrency] [rarities]
 *   e.g. npx tsx scripts/gen-loot-sprites.mts 4 mythic,legendary
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { LOOT_POOL } from '@/lib/underlord/loot'

const ROOT = process.cwd()
const KEY =
  process.env.OPENROUTER_API_KEY ||
  (() => {
    try {
      return (fs.readFileSync(path.join(ROOT, '.env.local.imagegen'), 'utf8').match(/OPENROUTER_API_KEY=(\S+)/) || [])[1] || ''
    } catch {
      return ''
    }
  })()
if (!KEY) throw new Error('no OPENROUTER_API_KEY')

const CONCURRENCY = Number(process.argv[2] || 4)
const RARITIES = (process.argv[3] || 'mythic,legendary,relic').split(',')
const MODEL = 'openai/gpt-5.4-image-2'
const SLOT_NOUN: Record<string, string> = {
  weapon: 'weapon',
  helm: 'helmet / crown',
  trinket: 'amulet / trinket relic',
}
const STYLE =
  'ornate dark-fantasy magic item illustration, a SINGLE object centered on a deep black background, dramatic glow/rim light, painterly, high detail, game inventory icon, no character, no hands, no text, no words, no border, square 1:1.'

const dir = path.join(ROOT, 'public/images/loot')
fs.mkdirSync(dir, { recursive: true })

const jobs = LOOT_POOL.filter(
  (it: any) => RARITIES.includes(it.rarity) && !fs.existsSync(path.join(dir, `${it.id}.jpg`)),
).map((it: any) => ({
  id: it.id,
  prompt: `A legendary ${SLOT_NOUN[it.slot] || 'artifact'} named "${it.name}". ${it.flavor} ${it.rarity === 'mythic' ? 'A reality-bending mythic artifact wreathed in power.' : ''} ${STYLE}`,
}))

console.log(`[loot-farm] ${jobs.length} missing loot icons (${RARITIES.join(',')}); concurrency ${CONCURRENCY}`)
if (jobs.length === 0) {
  console.log('[loot-farm] nothing to do.')
  process.exit(0)
}

async function gen(job: { id: string; prompt: string }): Promise<boolean> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, modalities: ['image', 'text'], messages: [{ role: 'user', content: job.prompt }] }),
    })
    const raw = await res.text()
    const i = raw.indexOf('{')
    if (i < 0) throw new Error('no json (' + res.status + ')')
    const j = JSON.parse(raw.slice(i))
    if (j.error) throw new Error(JSON.stringify(j.error))
    const url: string = j.choices?.[0]?.message?.images?.[0]?.image_url?.url || ''
    const b64 = url.split(',')[1]
    if (!b64) throw new Error('no image')
    const tmp = `/tmp/loot-${job.id}.png`
    fs.writeFileSync(tmp, Buffer.from(b64, 'base64'))
    execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '512', tmp, '--out', path.join(dir, `${job.id}.jpg`)], { stdio: 'ignore' })
    fs.unlinkSync(tmp)
    console.log(`[ok] loot/${job.id}.jpg (${((Date.now() - t0) / 1000) | 0}s)`)
    return true
  } catch (e: any) {
    console.log(`[FAIL] ${job.id}: ${e.message}`)
    return false
  }
}

let idx = 0, done = 0, okc = 0
async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++]
    if (await gen(job)) okc++
    done++
    console.log(`[loot-farm] ${done}/${jobs.length} (ok ${okc})`)
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
console.log(`[loot-farm] DONE — ${okc}/${jobs.length}`)
