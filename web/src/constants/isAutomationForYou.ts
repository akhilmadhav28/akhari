/**
 * Copy for `/is-automation-for-you` — the one page on the Site that isn't
 * trying to win a client, it's trying to help someone figure out whether they
 * have a problem worth solving. See `pages/IsAutomationForYou.tsx` for how
 * these render; this file only owns the words and the checklist scoring data.
 *
 * Every claim here is either (a) something already true of Akhari's own
 * case studies and copy elsewhere on the Site, or (b) a pattern found across
 * multiple small-business/SMB automation surveys during the 2026-09-15
 * research pass for this page — cited inline where it's doing real work.
 * Nothing is stated as a precise India-specific statistic unless it actually
 * is one, because most of the source surveys are US/EU/UK/OECD-skewed and
 * a small-business owner in Hyderabad deserves better than a borrowed number
 * dressed up as local fact.
 */

export const AWARENESS_POINTS: { title: string; body: string }[] = [
  {
    title: "You don't need to call it automation",
    body: 'If someone on your team retypes a WhatsApp order into a spreadsheet, checks Tally against stock by hand, or sends the same follow-up message every week because otherwise it would not get sent — that is already the kind of work automation replaces. Most owners do not recognise it as that, because it does not look like the "AI" they see written about elsewhere.',
  },
  {
    title: "The gap is usually what it looks like, not whether it fits",
    // 82% figure: small-business AI adoption survey data compiled 2026
    // (see e.g. Capsule CRM's roundup of the underlying research). The
    // source surveys skew US/EU/UK/OECD, not India-specific — stated below
    // as "one widely cited study," not as a number about Indian MSMEs,
    // because it is not one. The pattern it points at (smallest firms most
    // likely to self-exclude) is what the rest of this page is written
    // around either way.
    body: 'In one widely cited study, 82% of businesses under five employees said automation just did not apply to them — a number that drops sharply as the business gets bigger, which is a sign it was never really about fit. Most of that research comes from outside India, but the shape of the finding holds here too: the smallest businesses are the ones most likely to assume this is for someone else, and that belief fades the moment they see it done in a business that runs the way theirs does.',
  },
  {
    title: 'This is written for how a Hyderabad business actually runs',
    body: "Orders on WhatsApp, books in Tally, some customers paying cash on delivery — none of that is a reason automation does not apply. It is the starting point every one of Akhari's actual case studies started from.",
  },
]

export interface Myth {
  claim: string
  reality: string
}

export const MYTHS: Myth[] = [
  {
    claim: '"Automation means buying expensive enterprise software."',
    reality:
      'The systems behind this page’s own case studies run on a script and a low-cost server, not a six-figure platform. The tool is rarely the expensive part of automating something — working out what is actually worth automating is, which is the whole point of an audit before a quote.',
  },
  {
    claim: '"We tried AI tools already and they did not really help."',
    reality:
      'That is a common outcome, and it is usually not because automation does not work — it is because the wrong thing got automated, or the person who set it up moved on before it was actually working. The fix is not more AI. It is a narrower first target, and someone who is still around three months later when something breaks.',
  },
]

export interface AutomationTier {
  level: string
  name: string
  description: string
  example: string
}

export const TIERS: AutomationTier[] = [
  {
    level: '01',
    name: 'Rule-based automation',
    description: 'If this happens, do that. No judgment involved, nothing that could be argued with.',
    example: 'A new WhatsApp order gets logged into a sheet the moment it arrives, instead of at the end of the day.',
  },
  {
    level: '02',
    name: 'AI reading and deciding',
    description: "Handles input that is not identical every time — reads what came in, works out what it actually means, and responds accordingly.",
    example: "A customer message gets read, understood, and routed to the right person — not scanned for keywords, actually understood.",
  },
  {
    level: '03',
    name: 'Multi-step agents',
    description: 'Carries a task across several tools end to end, the way a person would if they had the time.',
    example: 'A lead comes in, gets checked and enriched, and only the qualified ones land in your inbox the next morning.',
  },
]

export interface GlossaryTerm {
  term: string
  definition: string
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Workflow',
    definition: 'The actual sequence a task follows in your business today — an order becomes a delivery, a message becomes a booking. Automation follows that same sequence; it does not invent a new one.',
  },
  {
    term: 'API',
    definition: 'The door one piece of software leaves open so another piece of software can talk to it directly, instead of a person copying information between the two by hand.',
  },
  {
    term: 'Webhook',
    definition: 'A doorbell one system rings the moment something happens — a form is submitted, an order lands — so whatever is listening can react immediately instead of someone checking back later.',
  },
  {
    term: 'Integration',
    definition: 'Two tools you already use — Tally and WhatsApp, say — set up to pass information to each other automatically.',
  },
  {
    term: 'AI agent',
    definition: 'A system that can read something written in plain language, work out what it is asking for, and act on it — the difference between a phone tree and someone who actually picks up.',
  },
  {
    term: 'n8n',
    definition: 'The tool most of the systems on this site are actually built on — a way of wiring the steps above together without writing a program from scratch every time.',
  },
]

/**
 * The self-assessment. Two separate lists on purpose:
 *
 * READINESS_SIGNALS score toward "there is something here worth automating."
 * CONSISTENCY_FLAGS never add to that score — checking one fires
 * CONSISTENCY_CAVEAT regardless of how many signals were checked, because a
 * business whose process is not yet consistent is not ready to automate it.
 * Automating something three people each do a different way just makes the
 * inconsistency faster, not fixed. This is the one place on the page the
 * "we will tell you if it is not worth it" line from the rest of the Site
 * becomes literal and interactive rather than a sentence.
 */
export interface ChecklistItem {
  id: string
  label: string
}

export const READINESS_SIGNALS: ChecklistItem[] = [
  {
    id: 'retyping',
    label: 'Someone retypes information from one place (a WhatsApp message, a call, a form) into another (a spreadsheet, Tally, a notebook)',
  },
  {
    id: 'manual-followups',
    label: 'The same message, reminder, or invoice goes out by hand, on a schedule, because otherwise it would not go out at all',
  },
  {
    id: 'reconciling',
    label: 'You or someone on your team spends real time each week matching numbers across two systems that do not talk to each other',
  },
  {
    id: 'depends-on-memory',
    label: 'Following up with a lead or a customer depends on someone remembering to do it',
  },
  {
    id: 'manual-reports',
    label: 'A report gets built by hand each month from information that already exists somewhere else in the business',
  },
]

export const CONSISTENCY_FLAGS: ChecklistItem[] = [
  {
    id: 'no-single-way',
    label: 'Different people on your team do this differently, and there is no single agreed "right way" written down anywhere',
  },
  {
    id: 'changes-often',
    label: 'The process changes often enough that nobody is fully sure what the current version even is',
  },
]

export interface ScoreBand {
  min: number
  max: number
  verdict: string
  body: string
}

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 0,
    max: 1,
    verdict: 'Probably not yet',
    body: 'Nothing here points at an obvious first system. That is a fine, honest answer — not every business needs this right now, and it is worth revisiting if that changes.',
  },
  {
    min: 2,
    max: 3,
    verdict: 'Worth a closer look',
    body: 'At least one of these is quietly costing you real time. That does not mean a large project — often it means one narrow, specific fix.',
  },
  {
    min: 4,
    max: 5,
    verdict: 'This is exactly what automation is for',
    body: 'Most of what shows up on this list is the ordinary, unglamorous work automation is actually good at. Worth a conversation, not because automation is trendy, but because this is what it was built to solve.',
  },
]

export const CONSISTENCY_CAVEAT: { title: string; body: string } = {
  title: 'One thing worth knowing first',
  body: 'You checked at least one box above about how inconsistently this runs today. That is worth fixing before it is worth automating — deciding how the task should go, once, so that automating it does not just make three different versions of it happen faster. This is exactly the kind of thing a free audit call sorts out before anything gets built.',
}
