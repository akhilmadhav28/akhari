/**
 * The intake extractor.
 *
 * This is the thing the demo on the page actually runs. It takes a raw message
 * — the kind that arrives on WhatsApp at 9pm, half-punctuated and missing the
 * details you need — and pulls out the fields a business would otherwise have a
 * person read off and retype: what they want, how much, by when, how to reach
 * them, and how urgent it is.
 *
 * ── On honesty ──────────────────────────────────────────────────────────────
 * There is no model call here, and the page says so plainly. This is rules:
 * patterns, keyword scoring and a date resolver, running in the visitor's
 * browser. That is a deliberate choice rather than a shortcut — a demo that
 * needs a server, an API key and a rate limiter to survive being linked on
 * WhatsApp is a demo that will be broken the week it matters.
 *
 * What it demonstrates is the *shape*: message in, fields out, routed, logged,
 * answered. The production version of this replaces one function — `extract` —
 * with a model call and keeps everything around it, which is exactly the point
 * being made. Rules handle the common path; the model earns its cost on the
 * messy tail this file will get wrong.
 *
 * Kept free of DOM and three.js imports so it stays testable on its own.
 */

export type Intent = 'ORDER' | 'QUOTE' | 'SUPPORT' | 'COMPLAINT' | 'MEETING' | 'GENERAL'
export type Channel = 'WhatsApp' | 'Email' | 'Phone' | 'Web form'
export type Urgency = 'normal' | 'high'

export interface Field {
  label: string
  value: string
}

export interface Extraction {
  channel: Channel
  intent: Intent
  urgency: Urgency
  /** Only the fields actually found — never padded with "not specified". */
  fields: Field[]
  route: string
  sla: string
  ref: string
  reply: string
}

/* ==========================================================================
   Patterns
   ========================================================================== */

// Indian mobile numbers: ten digits opening 6-9, optionally +91 and separators.
const PHONE = /(?:\+?91[\s-]?)?\b([6-9]\d{4}[\s-]?\d{5})\b/
const EMAIL = /\b([\w.+-]+@[\w-]+\.[\w.]{2,})\b/
const MONEY = /(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i
// Quantity has to be anchored to a unit word, or every phone number and order
// reference in the message reads as a quantity.
const QUANTITY = /\b(\d[\d,]*)\s*(units?|pcs|pieces|nos\.?|kgs?|boxes|sets|litres?|ltrs?|mtrs?|metres?)\b/i
const ORDER_REF = /(?:order|inv(?:oice)?|ref|ticket)\s*(?:no\.?|number|#)?\s*#?\s*([a-z0-9][a-z0-9-]{2,})\b/i
const HASH_REF = /#\s?([a-z0-9][a-z0-9-]{2,})\b/i

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Where the item name stops.
 *
 * Without this the lazy capture runs straight through the timing clause and
 * "50 boxes of copper fittings tomorrow" yields an item of "copper fittings
 * tomorrow" — the deadline eaten by the product name. Anything that can begin
 * a following clause has to terminate the item.
 */
const ITEM_STOP = [
  'by', 'for', 'to', 'on', 'before', 'after', 'and', 'with',
  'asap', 'urgent', 'today', 'tomorrow', 'tonight', 'next', 'this',
  'please', 'pls', 'thanks', 'thx', 'delivered', 'deliver', 'latest',
  ...DAYS.map((d) => d.slice(0, 3)),
].join('|')

const KEYWORDS: Record<Intent, string[]> = {
  ORDER: ['order', 'buy', 'purchase', 'supply', 'deliver', 'dispatch', 'need', 'want', 'require'],
  QUOTE: ['quote', 'quotation', 'rate', 'price', 'pricing', 'cost', 'how much', 'estimate'],
  SUPPORT: ['not working', 'failed', 'error', 'issue', 'problem', 'broken', 'stuck', 'help', 'fix', 'down'],
  COMPLAINT: ['third time', 'again', 'still waiting', 'nobody', 'no one', 'unacceptable', 'refund', 'escalate', 'complaint', 'worst', 'disappointed'],
  MEETING: ['call', 'meet', 'meeting', 'demo', 'available', 'schedule', 'discuss', 'catch up', 'free next'],
  GENERAL: [],
}

/**
 * How each channel is referred to inside a sentence. Dropping the channel name
 * in raw produces "I will come back on Phone", which is the exact register of
 * a template filling a slot — the thing this whole page is trying not to be.
 */
const REPLY_VIA: Record<Channel, string> = {
  WhatsApp: 'on WhatsApp',
  Email: 'by email',
  Phone: 'by phone',
  'Web form': 'by email',
}

const ROUTES: Record<Intent, string> = {
  ORDER: 'Sales queue',
  QUOTE: 'Sales queue',
  SUPPORT: 'Support queue',
  COMPLAINT: 'Akhil, directly',
  MEETING: 'Calendar + Akhil',
  GENERAL: 'Triage',
}

/* ==========================================================================
   Helpers
   ========================================================================== */

/** Next occurrence of a weekday, resolved against the visitor's own clock. */
function nextWeekday(target: number, from: Date): Date {
  const d = new Date(from)
  const delta = (target - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + delta)
  return d
}

// Comma stripped: these get nested inside "Tomorrow (…)" and inside sentences,
// and en-IN's default "Fri, 14 Aug" produces a pile-up of commas in both.
const fmt = (d: Date): string =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/,/g, '')

/**
 * Deadline resolution. Returns a real date wherever the message implies one,
 * because "by friday" is only useful to a system once it is a date — turning
 * relative language into an absolute timestamp is most of what intake is.
 */
function findDeadline(text: string, now: Date): string | null {
  if (/\b(asap|immediately|right away|urgent)\b/.test(text)) return 'ASAP'
  if (/\b(today|eod|end of day)\b/.test(text)) return `Today (${fmt(now)})`

  if (/\btomorrow\b/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return `Tomorrow (${fmt(d)})`
  }

  for (let i = 0; i < DAYS.length; i++) {
    // Matches "friday" and "fri", but not "fridge".
    if (new RegExp(`\\b${DAYS[i].slice(0, 3)}(${DAYS[i].slice(3)})?\\b`).test(text)) {
      return fmt(nextWeekday(i, now))
    }
  }

  if (/\bnext week\b/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 7)
    return `Week of ${fmt(d)}`
  }

  const explicit = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (explicit) {
    const day = Number(explicit[1])
    const month = Number(explicit[2])
    if (day <= 31 && month <= 12) {
      const year = explicit[3] ? Number(explicit[3].padStart(4, '20')) : now.getFullYear()
      return fmt(new Date(year, month - 1, day))
    }
  }

  return null
}

function findChannel(text: string): Channel {
  if (/\bwhats\s?app\b|\bwa\b|\bwhatsup\b/.test(text)) return 'WhatsApp'
  if (/\b(call|phone|ring|dial)\b/.test(text)) return 'Phone'
  if (EMAIL.test(text) || /\be-?mail\b/.test(text)) return 'Email'
  return 'Web form'
}

/**
 * Keyword scoring rather than first-match. A message can look like three things
 * at once ("the order failed again, call me"), and whichever pattern happens to
 * sit earliest in the file should not be what decides it.
 */
function findIntent(text: string): Intent {
  const scores = new Map<Intent, number>()

  for (const intent of Object.keys(KEYWORDS) as Intent[]) {
    let score = 0
    for (const word of KEYWORDS[intent]) if (text.includes(word)) score++
    if (score > 0) scores.set(intent, score)
  }

  if (scores.size === 0) return 'GENERAL'

  // A complaint outranks whatever it is a complaint about: the routing
  // consequence of getting this one wrong is the largest in the set.
  if (scores.has('COMPLAINT')) return 'COMPLAINT'

  let best: Intent = 'GENERAL'
  let bestScore = 0
  for (const [intent, score] of scores) {
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }
  return best
}

function findUrgency(text: string, intent: Intent): Urgency {
  if (intent === 'COMPLAINT') return 'high'
  return /\b(urgent|asap|immediately|today|right away|eod|third time|escalate)\b/.test(text)
    ? 'high'
    : 'normal'
}

/** Deterministic per-message, so re-running the same text gives the same ref. */
function makeRef(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return `AK-${String(h % 9000 + 1000)}`
}

/* ==========================================================================
   Reply drafting
   ========================================================================== */

function draftReply(x: Omit<Extraction, 'reply'>, deadline: string | null): string {
  const qty = x.fields.find((f) => f.label === 'Quantity')?.value
  const item = x.fields.find((f) => f.label === 'Item')?.value
  const ref = x.fields.find((f) => f.label === 'Reference')?.value

  const what = [qty, item].filter(Boolean).join(' of ')
  // "ASAP" is an urgency, not a date, and reads badly inside "for …".
  const dated = deadline && deadline !== 'ASAP' ? deadline : null
  const via = REPLY_VIA[x.channel]
  const soon = x.urgency === 'high' ? 'within the hour' : 'today'

  switch (x.intent) {
    case 'ORDER':
      return `Got it${what ? ` — ${what}${dated ? ` for ${dated}` : ''}` : ''}. Checking stock now and I will come back ${via} with confirmation and a delivery date ${soon}.`
    case 'QUOTE':
      return `Thanks — I can price this${what ? ` for ${what}` : ''}${
        dated ? `, delivered ${dated}` : ''
      }. Sending the rate ${via} ${
        x.urgency === 'high' ? 'within the hour' : 'by end of day'
      }, including delivery.`
    case 'SUPPORT':
      return `Sorry about this${ref ? ` on ${ref}` : ''}. It is logged as ${x.ref} and someone is on it now. You will get an update ${
        x.urgency === 'high' ? 'within two hours' : 'today'
      }, and I will tell you what went wrong rather than just that it is fixed.`
    case 'COMPLAINT':
      return `This should not have taken three attempts, and I am not going to pass it back to the same queue. ${x.ref} is with me directly${
        ref ? `, along with ${ref}` : ''
      }. You will hear from me within two hours with what happened and what I am doing about it.`
    case 'MEETING':
      return `Happy to.${dated ? ` ${dated} works at my end.` : ''} Send me two windows that suit you and I will hold one${
        x.channel === 'Phone' ? ' and call you then' : ''
      }. Twenty minutes is usually enough to work out whether there is anything worth building.`
    default:
      return `Thanks for getting in touch. Logged as ${x.ref} and I will reply ${via} ${soon}.`
  }
}

/* ==========================================================================
   Entry point
   ========================================================================== */

export function extract(raw: string, now: Date = new Date()): Extraction {
  const text = raw.toLowerCase()

  const channel = findChannel(text)
  const intent = findIntent(text)
  const urgency = findUrgency(text, intent)
  const deadline = findDeadline(text, now)

  const fields: Field[] = []

  const qty = raw.match(QUANTITY)
  if (qty) fields.push({ label: 'Quantity', value: `${qty[1]} ${qty[2]}` })

  // The noun phrase immediately after the unit is very often the item —
  // "200 units of 6mm board" — and where it is not, showing nothing is better
  // than showing a guess.
  const item = raw.match(
    new RegExp(`${QUANTITY.source}\\s*(?:of|x)?\\s+([a-z0-9][a-z0-9 .\\-]{2,28}?)(?=[,.!?]|\\s+(?:${ITEM_STOP})\\b|$)`, 'i'),
  )
  if (item?.[3]) fields.push({ label: 'Item', value: item[3].trim() })

  if (deadline) fields.push({ label: 'Deadline', value: deadline })

  const money = raw.match(MONEY)
  if (money) fields.push({ label: 'Value', value: `₹${money[1]}` })

  const ref = raw.match(ORDER_REF) ?? raw.match(HASH_REF)
  if (ref) {
    const v = ref[1].toUpperCase()
    // A bare number is meaningless on its own in a reply ("along with 4471").
    // Anything already carrying letters is its own identifier and is left be.
    fields.push({ label: 'Reference', value: /^\d+$/.test(v) ? `#${v}` : v })
  }

  const phone = raw.match(PHONE)
  if (phone) fields.push({ label: 'Phone', value: phone[1].replace(/[\s-]/g, '') })

  const email = raw.match(EMAIL)
  if (email) fields.push({ label: 'Email', value: email[1] })

  const base: Omit<Extraction, 'reply'> = {
    channel,
    intent,
    urgency,
    fields,
    route: ROUTES[intent],
    sla: urgency === 'high' ? '2 hours' : 'Same day',
    ref: makeRef(raw.trim()),
  }

  return { ...base, reply: draftReply(base, deadline) }
}

/** The three seeds offered as chips. Real shapes, not showcase sentences. */
export const SAMPLES: ReadonlyArray<{ label: string; text: string }> = [
  {
    label: 'Order',
    text: 'hi need 200 units of 6mm ply board by friday, whatsapp me the rate 9848012345',
  },
  {
    label: 'Complaint',
    text: 'payment failed twice on order #4471 and nobody has called back. this is the third time, please escalate',
  },
  {
    label: 'Enquiry',
    text: 'we want to automate attendance and the monthly reports. are you free next week for a call? akhil@example.com',
  },
]
