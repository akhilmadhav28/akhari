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
    role: 'Co-founder · Build & Delivery',
    bio: 'Akhil started as an entrepreneur too: a personalized gifting business that had to close when the lockdown hit. He spent the next stretch preparing for the UPSC civil services exam, and after three attempts that didn’t land, joined an EdTech company in sales. It was there, given the chance to build the automations behind his own job, that the pull back toward building things himself became impossible to ignore. Akhari is that: he scopes and builds every system it ships, with no handoff and no account manager standing between him and the work.',
  },
  {
    id: 'hari',
    name: 'Hari Prasad',
    role: 'Co-founder · Marketing & Sales',
    bio: 'Hari spent six years in the semiconductor industry, joining one company when it was three people and building the sales motion that helped take it past seventy: the pipeline, the outreach, the playbook that made that growth repeatable instead of lucky. Several organizations after that taught him the same lesson from different angles: most companies expect a lot from the people in them without giving those people the guidance to deliver it. Akhari is his answer to that as much as it is a business, built to run differently for the people in it, starting with the two founders.',
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
 * market). Framed instead as a nominal amount tied to what the system
 * actually solves — true to how Akhari prices work today, and it never goes
 * stale as real quotes move the way a printed range would.
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
    title: 'A nominal price for what it solves',
    body: 'We charge a nominal amount, based on what the system actually solves for your business, not a rate card. You know the number before we start building, not after.',
  },
  {
    title: 'Live in 2–4 weeks',
    body: 'From a scoped brief to something running in your business, not a slide deck about it.',
  },
  {
    title: 'Akhil builds it, not a team',
    body: 'The person who scopes your system is the one who ships it. No handoff, no account manager in between.',
  },
]

/**
 * Philosophy, consolidated 2026-09-15 from three unrelated single-line beliefs
 * (Stoicism / Scientific rationality / Routine, deliberately) into one
 * connected statement, written by Akhil directly rather than drafted here.
 * Kept as one intro plus a sequence rather than a 3-card grid on purpose —
 * these build on each other (the founding risk grounds the first idea, the
 * first idea leads into the next) rather than standing as parallel,
 * independent beliefs the way the old grid implied.
 */
export const PHILOSOPHY_INTRO = {
  heading: 'We build the way we think.',
  body: 'Akhari started with two people who quit stable jobs to bet on this: no safety net, no fallback. That kind of decision only makes sense if you have a clear philosophy about how to act when the outcome isn’t guaranteed. Ours comes from a few consistent ideas, tested in our own lives before we ever applied them to client work.',
}

export const PHILOSOPHY: { title: string; body: string }[] = [
  {
    title: 'Control what’s actually yours to control.',
    body: 'We don’t spend energy on outcomes we can’t influence: market conditions, what competitors do, whether a lead responds. We spend it entirely on the part that’s ours: the quality of the work, how fast we deliver, whether what we build actually gets used. That discipline isn’t abstract for us. It’s how we handled failing at something the first time, more than once, before finding the path that worked.',
  },
  {
    title: 'Adapt faster than the thing you’re building for.',
    body: 'Businesses that survive aren’t the ones with the fanciest system. They’re the ones that keep adjusting as conditions change. We build automation the same way: not a rigid, one-time install, but something that gets revised as your business actually runs, because the first version is never the last version.',
  },
  {
    title: 'Play the long game, not the trend.',
    body: 'We’re not chasing whatever’s loud this month. Good systems take patience to build right, and we’d rather be the automation that’s still running quietly in a year than the flashy demo that breaks the first time something unexpected happens.',
  },
  {
    title: 'Use leverage, not just effort.',
    body: 'The old way to grow a business was to trade more hours for more output. AI changes that math: one well-built system can do the work of hours, every day, without anyone having to be there. That’s the actual product we sell: not a tool, but leverage you didn’t have before.',
  },
  {
    title: 'Prove it before you sell it.',
    body: 'Before Akhari ever had a paying client, we built real systems for real businesses, for free, because we wanted proof it worked, not just a pitch that sounded good. We still think that way. We’d rather show you something working than tell you it will.',
  },
]
