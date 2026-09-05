/**
 * Founders — copy for `/founders` only.
 *
 * Kept separate from `content.ts` because this is the one page on the Site
 * that isn't about a client's system. `brand.ts` still owns the pronoun-level
 * facts (who runs Akhari, contact details); this file owns the two people
 * behind that.
 */

export interface Founder {
  id: string
  name: string
  role: string
  bio: string
}

export const FOUNDERS: Founder[] = [
  {
    id: 'akhil',
    name: 'Akhil Madhav',
    role: 'Co-founder — Build & Delivery',
    bio: 'Akhil scopes and builds every system Akhari ships — no handoff, no account manager translating between the client and the person doing the work. If something can’t be made faster or cheaper inside a real conversation, he says so instead of proposing a project anyway.',
  },
  {
    id: 'hari',
    name: 'Hari Prasad',
    role: 'Co-founder — Marketing & Sales',
    bio: 'Hari spent six years in the semiconductor industry, joining one company when it was three people and staying long enough to watch it grow past seventy. Several organizations after that taught him the same lesson from different angles: most companies expect a lot from the people in them without giving those people the guidance to deliver it. Akhari is his answer to that as much as it is a business — built to run differently for the people in it, starting with the two founders.',
  },
]

export const ORIGIN =
  'Hari and Akhil have been friends since the eighth grade, long before either of them had a reason to start a company together. Akhari started as Akhil’s studio, built system by system for businesses in Hyderabad. It is now the two of them, running it the way they think a company should be run in the first place.'

export const PHILOSOPHY: { title: string; body: string }[] = [
  {
    title: 'Stoicism',
    body: 'Don’t spend energy on what you can’t control — a client’s legacy spreadsheet, an API that changes without notice — and put all of it into the part you can, which is the system in front of you today.',
  },
  {
    title: 'Scientific rationality',
    body: 'Decisions get made from what’s measured, not from what feels right. If a workflow isn’t provably faster or cheaper than what it replaced, it doesn’t ship as a win.',
  },
  {
    title: 'Routine, deliberately',
    body: 'The same discipline that gets a person to show up and do a thing the same way every day is, at the scale of a business, what an automation is. That’s not a metaphor here — it’s the whole company.',
  },
]
