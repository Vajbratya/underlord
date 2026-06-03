/**
 * Light-troop sprite farm — the heroes' OWN holy minions (squires, clerics,
 * templars…), distinct from the Underlord's dark broods. Writes
 * public/images/hero-minions/<role>.jpg via OpenRouter gpt-5.4-image-2.
 * Idempotent. Run: npx tsx scripts/gen-hero-minions.mts [concurrency]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const KEY =
  process.env.OPENROUTER_API_KEY ||
  (fs.readFileSync(path.join(ROOT, '.env.local.imagegen'), 'utf8').match(/OPENROUTER_API_KEY=(\S+)/) || [])[1] || ''
if (!KEY) throw new Error('no OPENROUTER_API_KEY')

const CONCURRENCY = Number(process.argv[2] || 4)
const MODEL = 'openai/gpt-5.4-image-2'
const STYLE =
  'painterly dark-fantasy game art, single subject bust/portrait centered, dramatic HOLY rim light, gold and white and pale-blue tones, radiant, on a dark vignette, ominously righteous, intricate, no text, no words, no watermark, no border, square 1:1.'

// The light's troops — righteous, sanctimonious "good guys" you slaughter.
const ROLES: Record<string, string> = {
  cleric: 'a sanctimonious war-CLERIC of the Light, holy symbol raised, healing radiance',
  squire: 'a self-important young SQUIRE knight in polished plate, oversized sword, smug',
  zealot: 'a fanatical ZEALOT firebrand, torch and holy fire, fervent eyes',
  hunter: 'a righteous monster-HUNTER ranger, blessed bow, trophy cloak, vain',
  crossbow: 'a disciplined CROSSBOWMAN of the holy guard, blessed bolts, stern',
  confessor: 'a grim CONFESSOR inquisitor in white-and-gold robes, accusing finger, judging',
  flagellant: 'a bleeding FLAGELLANT penitent, whip and chains, ecstatic suffering, holy',
  mage: 'a haughty WHITE MAGE archmage, radiant staff, glowing sigils, condescending',
  penitent: 'a hooded PENITENT crusader, cilice and blade, sorrowful holy resolve',
  templar: 'a gleaming TEMPLAR knight, lightning-blessed greatsword, banner, arrogant',
  soldier: 'a generic holy-order SOLDIER, tabard and spear, brave and boring',
}

const dir = path.join(ROOT, 'public/images/hero-minions')
fs.mkdirSync(dir, { recursive: true })
const jobs = Object.entries(ROLES).filter(([role]) => !fs.existsSync(path.join(dir, `${role}.jpg`)))
console.log(`[hero-min] ${jobs.length} light troops to generate; concurrency ${CONCURRENCY}`)
if (jobs.length === 0) { console.log('done — all present'); process.exit(0) }

async function gen([role, desc]: [string, string]): Promise<boolean> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, modalities: ['image', 'text'], messages: [{ role: 'user', content: `${desc}. ${STYLE}` }] }),
    })
    const raw = await res.text()
    const i = raw.indexOf('{')
    if (i < 0) throw new Error('no json (' + res.status + ')')
    const j = JSON.parse(raw.slice(i))
    if (j.error) throw new Error(JSON.stringify(j.error))
    const url: string = j.choices?.[0]?.message?.images?.[0]?.image_url?.url || ''
    const b64 = url.split(',')[1]
    if (!b64) throw new Error('no image')
    const tmp = `/tmp/hm-${role}.png`
    fs.writeFileSync(tmp, Buffer.from(b64, 'base64'))
    execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '640', tmp, '--out', path.join(dir, `${role}.jpg`)], { stdio: 'ignore' })
    fs.unlinkSync(tmp)
    console.log(`[ok] hero-minions/${role}.jpg (${((Date.now() - t0) / 1000) | 0}s)`)
    return true
  } catch (e: any) {
    console.log(`[FAIL] ${role}: ${e.message}`)
    return false
  }
}

let idx = 0, ok = 0
async function worker() { while (idx < jobs.length) { if (await gen(jobs[idx++])) ok++ } }
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
console.log(`[hero-min] DONE — ${ok}/${jobs.length}`)
