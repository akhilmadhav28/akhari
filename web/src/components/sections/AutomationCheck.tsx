import { Reveal } from '@/components/ui/Reveal'

/**
 * A dedicated, full-weight pointer to `/is-automation-for-you`, sitting after
 * `CTA` and before `Footer` rather than inside the scroll story proper.
 *
 * Every other section on this page is a module in the 3D graph (see `App`'s
 * page-order comment): About connects the API, Services brings the AI and the
 * database, Projects branches it, CTA lands the last cable. Slotting a new
 * section in among those would mean giving it its own module, anchor and
 * camera shot — a real addition to the workflow, not a content edit. This
 * section sits past `#contact` instead, where the fixed WebGL canvas has
 * already settled at its completed, static frame (exactly where `Footer`
 * already lives), so it rides on top of that backdrop for free with zero
 * effect on the choreography.
 *
 * Styled as `.paper` on purpose: the page it points to is a self-assessment,
 * not a pitch, and the printed-worksheet surface already carries that meaning
 * everywhere else it appears (see `PipelineDemo`).
 */
export function AutomationCheck() {
  return (
    <section className="relative bg-void py-16 sm:py-20">
      <div className="wrap">
        <Reveal>
          <div className="panel panel-sheen paper mx-auto max-w-[42rem] p-8 sm:p-10">
            <p className="eyebrow">
              <span className="h-px w-6 bg-line-strong" />
              Before you reach out
            </p>
            <h2 className="mt-4 text-[1.6rem] font-sans font-semibold sm:text-[1.9rem]">
              Is automation for you?
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
              A plain, no-pitch page for owners who aren&rsquo;t sure yet: what usually turns out
              to be worth automating, the myths that get in the way, and a two-minute self-check
              you can run right now, on your own, before you ever talk to us.
            </p>
            <a
              href="/is-automation-for-you"
              className="btn btn-primary mt-7 inline-flex"
              data-cursor-target
            >
              Read it first
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
