import { useEffect, type ReactNode } from 'react'
import { BRAND } from '@/constants/brand'

/**
 * Privacy policy. A plain document, not a scene.
 *
 * Deliberately outside the one-page scroll experience: no Lenis, no
 * WorkflowScene, no cursor. A legal page has one job — be readable and be
 * indexable — and pulling in three.js to render text would work against both.
 * See `main.tsx` for the plain pathname check that routes here instead of
 * mounting `App`.
 */

const UPDATED = 'September 5, 2026'

function Section({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="scroll-mt-24 border-t border-line py-9" id={`s${n}`}>
      <h2 className="flex items-baseline gap-3 text-[1.4rem]">
        <span className="font-mono text-[0.9rem] font-normal text-faint">{n}</span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-ink-dim">
        {children}
      </div>
    </section>
  )
}

export function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy — Akhari'
  }, [])

  return (
    <div className="min-h-screen bg-void">
      <header className="border-b border-line">
        <div className="wrap-narrow flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label={`${BRAND.name} — home`}>
            <img
              src="/brand/logo-mark-sm.png"
              alt=""
              width={26}
              height={25}
              className="h-6 w-auto"
            />
            <span className="font-mono text-[0.78rem] tracking-[0.34em] text-ink">
              {BRAND.wordmark}
            </span>
          </a>
          <a
            href="/"
            className="font-mono text-[0.7rem] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
          >
            ← Back to site
          </a>
        </div>
      </header>

      <main className="wrap-narrow py-16 sm:py-20">
        <p className="eyebrow">
          <b>Legal</b>
          <span className="h-px w-6 bg-line-strong" />
          Last updated {UPDATED}
        </p>

        <h1 className="mt-5 text-[2.25rem] sm:text-[2.75rem]">Privacy Policy</h1>

        <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-dim">
          {BRAND.name} ("{BRAND.name}", "we", "us") is an AI automation studio run by Akhil Madhav
          and Hari Prasad out of {BRAND.location}. This policy explains what we collect through{' '}
          <span className="text-ink">akhari.vercel.app</span> (the "Site"), and how we handle data
          when we design, build and operate automation systems for clients — including systems
          that integrate the LinkedIn API or run on the n8n workflow-automation platform.
        </p>

        <div className="mt-10">
          <Section n="01" title="Scope">
            <p>
              This policy covers two things: the Site itself, and the automation systems Akhari
              builds and operates for clients. Where they differ, each section says so — the Site
              is small and collects almost nothing on its own; a delivered automation can handle
              real customer data on a client's behalf, and that is where most of this policy
              applies.
            </p>
            <p>
              If you are a visitor reading this before contacting us, the short version is
              Section&nbsp;2. If you are a client, a prospective client, or someone whose data
              passes through a system we operate, Sections&nbsp;6 and&nbsp;7 are the ones that
              matter to you.
            </p>
          </Section>

          <Section n="02" title="Information collected through the Site">
            <p>The Site does not run analytics, does not set tracking cookies, and does not ask you to create an account. Specifically:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-ink">Contact details you give us directly</span> — if you
                email {BRAND.email}, call {BRAND.phone}, or write to us some other way, we hold
                whatever you send (your address, phone number, and the content of the message) for
                as long as it takes to answer you and, if we start working together, for the
                duration of that engagement.
              </li>
              <li>
                <span className="text-ink">The live pipeline demo</span> on the Site (the "Try it
                on a real message" panel) runs entirely in your browser. Whatever you type into it
                is parsed on your device and is never transmitted anywhere — we do not see it,
                store it, or log it.
              </li>
              <li>
                <span className="text-ink">Standard hosting logs.</span> The Site is served by
                Vercel, which — like any web host — records basic connection metadata (IP address,
                user agent, request timestamps) for security and reliability. We do not access
                this beyond what Vercel's own dashboard provides and do not combine it with any
                other data we hold.
              </li>
            </ul>
            <p>
              If that changes — for example, if we add product analytics — we will update this
              policy first and describe what is added and why.
            </p>
          </Section>

          <Section n="03" title="How we use information">
            <ul className="list-disc space-y-2 pl-5">
              <li>To respond to enquiries sent through the contact details on the Site.</li>
              <li>To scope, deliver, and support automation work for clients.</li>
              <li>To meet legal, accounting, and security obligations.</li>
            </ul>
            <p>We do not sell personal data, and we do not use it for advertising, of any kind, on any platform.</p>
          </Section>

          <Section n="04" title="Legal basis for processing">
            <p>
              Where the EU/UK GDPR applies, we rely on: your consent (for example, sending us a
              message), performance of a contract (delivering work you have engaged us for),
              and our legitimate interest in running and securing the business. Where India's
              Digital Personal Data Protection Act, 2023 applies, we process personal data only
              for the specified purpose it was given for and rely on your consent or a permitted
              legitimate use.
            </p>
          </Section>

          <Section n="05" title="Cookies">
            <p>
              The Site does not use tracking or advertising cookies. Any cookie a browser sets on
              this domain is limited to what is strictly necessary for the page to function (for
              example, remembering a reduced-motion preference) — nothing that identifies you or
              follows you elsewhere.
            </p>
          </Section>

          <Section n="06" title="The LinkedIn API">
            <p>
              Some systems Akhari builds — for the Site's own outreach or for a client — connect
              to the LinkedIn API to read or act on data a user has explicitly authorized through
              LinkedIn's own OAuth consent screen. In every such integration:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                We request only the scopes an integration actually needs, and only after the
                LinkedIn account holder has granted permission through LinkedIn directly — we
                never ask for or handle a LinkedIn password.
              </li>
              <li>
                Data obtained through the LinkedIn API is used solely for the purpose disclosed at
                the time of authorization (for example, posting on a connected account's behalf,
                or reading messages to route them into a workflow) and is not repurposed,
                enriched with outside data, or sold.
              </li>
              <li>
                Access can be revoked at any time from the LinkedIn account's own
                "Permitted Services" settings, independent of anything we control.
              </li>
              <li>
                We retain LinkedIn-derived data only for as long as the authorized purpose
                requires, or as instructed by the client on whose behalf it was collected, and
                delete it on request.
              </li>
              <li>
                Akhari is an independent studio and is not affiliated with, endorsed by, or
                sponsored by LinkedIn Corporation or Microsoft. "LinkedIn" is a trademark of
                LinkedIn Corporation.
              </li>
            </ul>
          </Section>

          <Section n="07" title="n8n and workflow automation">
            <p>
              Akhari builds automations on n8n, a workflow-automation engine that we typically
              self-host on infrastructure controlled by Akhari or by the client. Where an n8n
              workflow processes personal data as part of a delivered system — routing a customer
              message, writing a row to a database, sending a notification — Akhari acts as a data
              processor on the client's behalf, not as the owner of that data.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Credentials and API keys used by a workflow are stored encrypted, within n8n's own credential store, and are not shared outside the engagement they belong to.</li>
              <li>Data in transit between connected services is sent over encrypted connections (HTTPS/TLS).</li>
              <li>Access to a client's n8n instance and its execution logs is restricted to the people who need it to build and maintain the workflow.</li>
              <li>Execution logs and stored data are retained only as long as the workflow's purpose requires, or per the retention terms agreed with the client, and are deleted at the end of an engagement on request.</li>
            </ul>
            <p>
              If you are the end customer of a business that uses an Akhari-built system, that
              business is the controller of your data and its own privacy policy governs how it
              uses it. Direct any data request to them first; we will support them in fulfilling
              it.
            </p>
          </Section>

          <Section n="08" title="Sub-processors and third parties we use">
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="text-ink">Vercel</span> — hosts this Site.</li>
              <li><span className="text-ink">n8n</span> (self-hosted) — runs delivered automations.</li>
              <li><span className="text-ink">LinkedIn API</span> — only where a specific integration is authorized, as described in Section&nbsp;6.</li>
              <li>
                Any other service a particular client engagement connects to (a CRM, a database, a
                messaging API) — always disclosed to that client as part of the build, since they
                are the ones authorizing the connection.
              </li>
            </ul>
            <p>We do not share personal data with third parties for their own marketing purposes.</p>
          </Section>

          <Section n="09" title="Data retention">
            <p>
              We keep contact enquiries and client data for as long as needed to respond, deliver
              the engagement, and meet legal or accounting obligations, then delete or anonymize
              it. A client engagement's specific retention period is agreed in the contract for
              that work; absent a stated term, we retain operational data for up to three years
              after the engagement ends and delete it sooner on request.
            </p>
          </Section>

          <Section n="10" title="Security">
            <p>
              We apply reasonable technical and organizational measures appropriate to a small
              studio handling client systems: encrypted credential storage, encrypted transport,
              least-privilege access to client infrastructure, and no storage of secrets outside
              the tools built to hold them (n8n's credential store, a password manager, or the
              client's own vault). No system is perfectly secure, and we will tell you promptly if
              a breach affects your data.
            </p>
          </Section>

          <Section n="11" title="Your rights">
            <p>
              Depending on where you are, you may have the right to access, correct, delete, or
              export the personal data we hold about you, to object to or restrict certain
              processing, to withdraw consent at any time, and to lodge a complaint with your
              local data protection authority. To exercise any of these, email{' '}
              <a href={`mailto:${BRAND.email}`} className="text-accent underline underline-offset-2">
                {BRAND.email}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section n="12" title="International transfers">
            <p>
              Akhari operates from India. Where a client or a connected service (such as the
              LinkedIn API or a hosting provider) is based elsewhere, data may be processed outside
              your own country. We rely on the receiving service's own safeguards and, for
              client engagements, on contractual terms appropriate to the transfer.
            </p>
          </Section>

          <Section n="13" title="Children's privacy">
            <p>
              The Site and Akhari's services are directed at businesses, not children. We do not
              knowingly collect personal data from anyone under 18. If you believe a child has
              provided us data, contact us and we will delete it.
            </p>
          </Section>

          <Section n="14" title="Changes to this policy">
            <p>
              We will update this page if what we collect or how we process it changes, and update
              the date at the top. Material changes affecting an active client engagement will be
              communicated directly, not just posted here.
            </p>
          </Section>

          <Section n="15" title="Contact">
            <p>
              Akhil Madhav &amp; Hari Prasad, {BRAND.name} — {BRAND.location}.
              <br />
              <a href={`mailto:${BRAND.email}`} className="text-accent underline underline-offset-2">
                {BRAND.email}
              </a>{' '}
              ·{' '}
              <a href={`tel:${BRAND.phoneHref}`} className="text-accent underline underline-offset-2">
                {BRAND.phone}
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="mono-tag text-faint">
            &copy; {new Date().getFullYear()} {BRAND.wordmark}
          </p>
        </div>
      </main>
    </div>
  )
}
