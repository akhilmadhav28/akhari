/**
 * Page copy and case-study data.
 *
 * Project entries are the real systems from the existing Akhari site — named
 * clients, their own words, and what was actually built. Kept in one file so
 * the copy can be edited without touching component code.
 */

export interface Service {
  id: string
  title: string
  body: string
  /** Drawn as an inline SVG path on a 24x24 grid. */
  icon: string
}

export const SERVICES: Service[] = [
  {
    id: 'ai-automation',
    title: 'AI Automation',
    body: 'A model reads the thing, works out what it is, and writes the reply. Inside the process you already run.',
    icon: 'M12 3.5 13.9 9 19.5 10.9 13.9 12.8 12 18.3 10.1 12.8 4.5 10.9 10.1 9Z M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z',
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    body: 'Intake, follow-ups, scheduling, the Monday report. The middle of your business, running with nobody driving it.',
    // Two modules with data passing between them.
    icon: 'M3 8h6v8H3zM15 8h6v8h-6zM9 12h6M13.2 10l2 2-2 2',
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    body: 'Picks up on the second ring, asks what you would have asked, puts it in your calendar and logs every word.',
    // Microphone — the agents people actually meet are the ones that talk.
    icon: 'M12 3.5a2.8 2.8 0 0 1 2.8 2.8v5.4a2.8 2.8 0 0 1-5.6 0V6.3A2.8 2.8 0 0 1 12 3.5ZM6.4 11v.9a5.6 5.6 0 0 0 11.2 0V11M12 17.5V21',
  },
  {
    id: 'api-integrations',
    title: 'API Integrations',
    body: 'Your tools actually talking to each other. Tally, WhatsApp, Sheets, your CRM, the thing your supplier insists on.',
    // Plug and socket.
    icon: 'M9 3v5.5M15 3v5.5M6.5 8.5h11v3.2a5.5 5.5 0 0 1-11 0zM12 17.2V21',
  },
  {
    id: 'bpa',
    title: 'Business Process Automation',
    body: 'Not one task at a time. Intake through approval through fulfilment, plus the report that proves it happened.',
    icon: 'M4 6h16M4 12h16M4 18h10M18 15l2 2 3-3',
  },
]

export interface Project {
  id: string
  client: string
  person: string
  title: string
  body: string
  /** Rendered as a monospace pipeline. */
  architecture: string[]
  tech: string[]
  result: string
  quote?: string
  /**
   * IMAGE SLOT — a path under `public/work/`, e.g. `/work/legacy.png`.
   *
   * The featured project draws its own pipeline diagram when this is unset, so
   * the layout is complete without it and nothing 404s. A real screenshot is
   * the single biggest upgrade available to this page: the strongest candidates
   * are an n8n canvas (own IP, no client data) or a dashboard with the figures
   * blurred. Roughly 4:3, 1400px wide or better, dark UI preferred.
   */
  image?: string
}

export const PROJECTS: Project[] = [
  {
    id: 'legacy',
    client: 'Legacy Microtronix',
    person: 'Aravind Nair — Director',
    title: 'Four spreadsheets became one live screen',
    body: 'Profit, stock and staffing lived in separate files that were reconciled by hand, days late. Now they are one dashboard that updates itself.',
    architecture: ['Sheets + ERP export', 'scheduled sync', 'aggregation', 'live dashboard'],
    tech: ['Python', 'Sheets API', 'Postgres'],
    result: 'No month-end scramble. Numbers current to the minute.',
    quote: 'No more jumping between spreadsheets to see where things actually stand.',
  },
  {
    id: 'bp-batteries',
    client: 'BP Batteries',
    person: 'Gaurav Shukla — Owner',
    title: 'Posting that does not depend on remembering',
    // NOTE — the old site carried only the client, the quote and one line:
    // "Scheduled social posting". `title`, `body`, `architecture`, `tech` and
    // `result` below are written from that, not from the build. Correct them
    // if the real pipeline differs. (`tech` is not rendered for listed
    // projects — only the featured one shows it.)
    body: 'Putting content out was a job that only happened when somebody had a free half hour, which meant stretches where nothing went out at all. It runs to a schedule now, with nobody driving it.',
    architecture: ['content queue', 'scheduled publish', 'delivery log'],
    tech: ['n8n', 'Sheets API'],
    result: 'Goes out on time whether or not anyone sits down to do it.',
    quote: 'Now it goes out on its own, on schedule, without anyone having to sit down and do it.',
  },
  {
    id: 'imu',
    client: 'IMU Imports & Exports',
    person: 'Mohammed Imran — Proprietor',
    title: 'Leads that arrive without anyone looking',
    body: 'Prospecting was a person with browser tabs. It became a scheduled job that finds, filters and enriches, then files the result.',
    architecture: ['scheduled crawl', 'filter + dedupe', 'enrichment', 'CRM + daily digest'],
    tech: ['Python', 'n8n', 'Email API'],
    result: 'A qualified list every morning, with no one assigned to build it.',
    quote: 'It has given us real time back.',
  },
  {
    id: 'eight-audio',
    client: 'Eight Audio',
    person: 'Vanga Shravanth Reddy — CEO',
    title: 'Attendance and posting that run themselves',
    body: 'Two jobs that only happened when somebody remembered: reconciling attendance, and putting content out. Neither needs a person now.',
    architecture: ['biometric export', 'sync', 'dashboard', 'content queue', 'scheduler'],
    tech: ['n8n', 'Sheets API', 'Instagram Graph API'],
    result: 'Posts go out on schedule. Attendance is never reconstructed after the fact.',
    quote: 'Now posts go out on schedule without anyone having to remember.',
  },
]
