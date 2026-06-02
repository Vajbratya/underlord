/**
 * Sprite farm — generates missing unit/hero portraits via OpenRouter
 * (openai/gpt-5.4-image-2) and writes them as JPGs into public/images.
 *
 * Idempotent: skips any id that already has a file, so it's safe to
 * re-run after adding more bosses/minions (only fills the gaps) and to
 * resume after an interruption.
 *
 *   OPENROUTER_API_KEY=... npx tsx scripts/gen-sprites.mts [concurrency]
 *
 * The key is read from env or ./.env.local.imagegen (gitignored).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { MINION_TEMPLATES } from '@/lib/underlord/units'
import { HEROES } from '@/lib/elementum-flavor'

const ROOT = process.cwd()
const KEY =
  process.env.OPENROUTER_API_KEY ||
  (() => {
    try {
      const t = fs.readFileSync(path.join(ROOT, '.env.local.imagegen'), 'utf8')
      return (t.match(/OPENROUTER_API_KEY=(\S+)/) || [])[1] || ''
    } catch {
      return ''
    }
  })()
if (!KEY) throw new Error('no OPENROUTER_API_KEY')

const CONCURRENCY = Number(process.argv[2] || 3)
const MODEL = 'openai/gpt-5.4-image-2'
const STYLE =
  'painterly digital game art, dark fantasy, single subject centered as a bust/portrait, dramatic rim light, dark moody vignette background, ominous, high contrast, intricate detail, no text, no words, no watermark, no border, square 1:1 composition.'

type Job = { id: string; dir: 'minions' | 'heroes'; prompt: string }

const jobs: Job[] = []
for (const t of Object.values(MINION_TEMPLATES) as any[]) {
  const out = path.join(ROOT, 'public/images/minions', `${t.archetype}.jpg`)
  if (fs.existsSync(out)) continue
  jobs.push({
    id: t.archetype,
    dir: 'minions',
    prompt: `A "${t.name}" — ${t.role}. ${t.flavor} A monstrous minion creature of the Underlord's army. ${STYLE}`,
  })
}
for (const h of HEROES as any[]) {
  const out = path.join(ROOT, 'public/images/heroes', `${h.id}.jpg`)
  if (fs.existsSync(out)) continue
  const epic = h.eliteKind === 'boss' ? ' An imposing, epic BOSS — larger than life, throne-room grandeur.' : h.eliteKind === 'miniboss' ? ' A formidable elite miniboss.' : ''
  jobs.push({
    id: h.id,
    dir: 'heroes',
    prompt: `A villainous fantasy "hero" antagonist: ${h.name}, ${h.title}. ${h.bio}${epic} Portray them as a punchable, self-important adventurer-villain. ${STYLE}`,
  })
}

console.log(`[farm] ${jobs.length} missing sprites; concurrency ${CONCURRENCY}`)
if (jobs.length === 0) {
  console.log('[farm] nothing to do — all sprites present.')
  process.exit(0)
}

async function gen(job: Job): Promise<boolean> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content: job.prompt }],
      }),
    })
    const raw = await res.text()
    const i = raw.indexOf('{')
    if (i < 0) throw new Error('no json (' + res.status + ')')
    const j = JSON.parse(raw.slice(i))
    if (j.error) throw new Error(JSON.stringify(j.error))
    const url: string = j.choices?.[0]?.message?.images?.[0]?.image_url?.url || ''
    const b64 = url.split(',')[1]
    if (!b64) throw new Error('no image in response')
    const tmp = `/tmp/sprite-${job.dir}-${job.id}.png`
    fs.writeFileSync(tmp, Buffer.from(b64, 'base64'))
    const out = path.join(ROOT, 'public/images', job.dir, `${job.id}.jpg`)
    execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '768', tmp, '--out', out], { stdio: 'ignore' })
    fs.unlinkSync(tmp)
    console.log(`[ok] ${job.dir}/${job.id}.jpg  (${((Date.now() - t0) / 1000) | 0}s)`)
    return true
  } catch (e: any) {
    console.log(`[FAIL] ${job.dir}/${job.id}: ${e.message}`)
    return false
  }
}

// Simple concurrency pool.
let idx = 0
let done = 0
let okc = 0
async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++]
    const ok = await gen(job)
    done++
    if (ok) okc++
    console.log(`[farm] ${done}/${jobs.length} (ok ${okc})`)
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
console.log(`[farm] DONE — ${okc}/${jobs.length} sprites generated.`)
