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
  /** One entry per paragraph — Hari's runs longer than Akhil's, by design. */
  bio: string[]
  /** Path under `public/founders/`. */
  photo: string
  email: string
  phone: string
  phoneHref: string
  /** Full profile URL. Optional until both are on hand. */
  linkedin?: string
}

export const FOUNDERS: Founder[] = [
  {
    id: 'akhil',
    name: 'Akhil Madhav',
    role: 'Co-founder · Chief Technology Officer',
    photo: '/founders/akhil.jpg',
    bio: [
      'Before Akhari, Akhil spent years preparing for one of the most competitive paths in the country, and came up short more than once. That led somewhere he didn’t expect: a business development role at an EdTech company, where he started teaching himself to build with AI tools on the side, outside anything the job actually asked for. Voice agents, automated dashboards, lead-scraping systems: none of it required a technical background, just a willingness to actually use the tools available.',
      'That experience shaped a core belief he builds Akhari around: used the right way, AI is real leverage. It let a non-technical BD hire teach himself to build production systems, and it’s the same leverage he’s since used to build Akhari’s own CRM and internal tools from scratch.',
      'He leads delivery and technical build, and sits in on client calls where the technical questions need real answers, not a sales pitch. He’s noticed that most people meet a new tool with hesitation long before they’ve actually tried it, and made a habit of leaning in first instead. That’s the same instinct he wants every client to walk away with, not just a system, but the ability to move as fast as the ones already using it.',
      'Off the clock: a daily stoic practice and a few blitz chess games most nights.',
    ],
    email: 'akhil@akhari.in',
    phone: '+91 94930 60424',
    phoneHref: '+919493060424',
    linkedin: 'https://www.linkedin.com/in/akkimadhav/',
  },
  {
    id: 'hari',
    name: 'Hari Prasad',
    role: 'Co-founder · Chief Solutions Officer',
    photo: '/founders/hari.jpg',
    bio: [
      'Hari brings over six years of experience across sales, business development, and commercial strategy, with a strong understanding of how businesses operate, and where they lose time, money, and momentum.',
      'He began his career at an early-stage startup, joining when the company had just three people, and helped build its sales operation as it grew beyond seventy employees. That experience gave him a practical understanding of customer acquisition, process building, team development, and the difference between isolated effort and a repeatable system.',
      'Over the years, working across different organizations and industries, Hari became increasingly interested in a deeper question: why do businesses continue to depend on manual processes, fragmented information, and inconsistent execution when better systems are possible?',
      'At Akhari, he focuses on identifying those problems, translating them into practical automation opportunities, and shaping solutions that create measurable business value. He works at the intersection of business strategy, process design, technology, and customer needs, ensuring that automation is not implemented simply because it is possible, but because it is useful.',
      'Akhari is also an expression of how he believes businesses should be built: with clarity, ownership, thoughtful systems, and an environment where people are given the context and tools to do meaningful work.',
    ],
    email: 'hari@akhari.in',
    phone: '+91 85558 37355',
    phoneHref: '+918555837355',
    linkedin: 'https://www.linkedin.com/in/hari-prasad-550141139/',
  },
]

export const ORIGIN =
  'Hari and Akhil have been friends since the eighth grade, long before either of them had a reason to start a company together. Akhari began as one system for one business in Hyderabad, then another, then enough of them that running it properly took two people instead of one. It is now Hari and Akhil, building it the way they think a company should be run in the first place.'

/**
 * "What working with us is like" — the founders page had who-we-are and
 * what-we-believe but never made the practical part concrete: price, timeline,
 * effort on the client's side.
 *
 * Pricing deliberately quotes no number or range (changed 2026-09-16, was a
 * ₹40,000–₹1,50,000 band benchmarked against the AI-automation/n8n freelance
 * market). Framed instead as a reasonable amount tied to what the system
 * actually solves — true to how Akhari prices work today, and it never goes
 * stale as real quotes move the way a printed range would. Changed again
 * 2026-09-16 from "nominal" to "reasonable": nominal reads as token/trivial,
 * which understates real project pricing and sets the wrong expectation.
 *
 * The "Free audit call" body was rewritten 2026-09-15 against Nate Herk's
 * (AI Automation Society) published audit methodology — rank what's found by
 * volume, labour cost, feasibility and risk, not just "look at the process" —
 * to make the call sound like a real method instead of a vague first chat.
 * One open tension worth flagging: Herk's own model prices this step
 * separately ($500-$2,500, framed as a filter for serious buyers), where
 * Akhari's is free. Free is the right call for a first client in Hyderabad
 * with four case studies and no brand yet, not obviously right forever —
 * revisit once there's enough inbound interest that a free audit is costing
 * real time on unqualified calls, not before.
 */
export const PROCESS: { title: string; body: string }[] = [
  {
    title: 'Free audit call',
    body: 'We map how the work actually moves (who touches it, what it costs in time, what breaks first) and rank what is worth automating before quoting anything. No cost, no obligation either way.',
  },
  {
    title: 'A reasonable price for what it solves',
    body: 'We charge a reasonable amount, based on what the system actually solves for your business, not a rate card. You know the number before we start building, not after.',
  },
  {
    title: 'Live in 2–4 weeks',
    body: 'From a scoped brief to something running in your business, not a slide deck about it.',
  },
  {
    title: 'We build it, not a team',
    body: 'The people who scope your system are the ones who ship it. No handoff, no account manager in between.',
  },
]

/**
 * Philosophy, rewritten 2026-09-16 by Akhil directly (replaces the
 * 2026-09-15 consolidation). Kept as one intro plus a sequence rather than a
 * 3-card grid on purpose — these build on each other rather than standing as
 * parallel, independent beliefs the way a grid would imply.
 */
export const PHILOSOPHY_INTRO = {
  heading: 'We build the way we think.',
  body: 'Akhari started with two people who chose to build differently, with a clear philosophy about how to act when the outcome isn’t guaranteed. These principles come from ideas we have tested in our own lives before applying them to client work.',
}

export const PHILOSOPHY: { title: string; body: string }[] = [
  {
    title: 'Control what’s actually yours to control.',
    body: 'We don’t spend energy on outcomes we can’t influence: market conditions, competitors, or whether a lead responds. We focus on what is ours: the quality of the work, how quickly we deliver, and whether what we build actually gets used. That discipline is how we approach uncertainty, setbacks, and decisions.',
  },
  {
    title: 'Build for change, not just the current version of the business.',
    body: 'Businesses evolve. Their processes, priorities, and constraints change with them. We build automation that can be reviewed, adjusted, and improved as the business develops, not rigid systems that become obsolete after the first change.',
  },
  {
    title: 'Play the long game, not the trend.',
    body: 'We’re not chasing whatever is loud this month. Good systems take patience to build properly. We’d rather create automation that continues working quietly a year from now than a flashy demo that breaks the first time something unexpected happens.',
  },
  {
    title: 'Use leverage, not just effort.',
    body: 'The old way to grow a business was often to trade more hours for more output. Automation changes that equation. A well-built system can handle repetitive work consistently, reduce manual effort, and free people to focus on decisions that actually require them. That’s the leverage we aim to create.',
  },
  {
    title: 'Prove it before you sell it.',
    body: 'Before Akhari had a paying client, we built and tested real systems for real businesses because we wanted evidence, not just a convincing pitch. We still think that way. We’d rather show you something working than tell you it will.',
  },
]
