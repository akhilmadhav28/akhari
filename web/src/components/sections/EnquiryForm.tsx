import { useRef, useState, type FormEvent } from 'react'
import { crm } from '@/lib/crm/client'

/**
 * Replaces the mailto/tel buttons in `CTA` with a real form that writes
 * straight into the Akhari CRM's `leads` table (see `lib/crm/client.ts`) —
 * no backend of this site's own, no intermediate service.
 *
 * The single "email or phone" field is split heuristically before insert:
 * anything with an `@` goes to `email`, everything else to `phone`. The CRM's
 * board doesn't care which one is empty; it just needs a way to reach back.
 *
 * The anon key is public, so the database policy (`Akhari- CRM/supabase/
 * 002_public_website_enquiry.sql`) is the real gate and enforces the length
 * caps below. They are repeated here only so a person who overshoots one gets
 * stopped by the input, not by a generic "something went wrong". Keep the two
 * in step. The honeypot and the minimum-time check are a courtesy filter for
 * bots that fill a form and submit it instantly; they do not replace the policy.
 */

type Status = 'idle' | 'submitting' | 'success' | 'error'

const LIMITS = { name: 200, contact: 254, business: 200, message: 2000 } as const
/** A human cannot read, type and submit this form faster than this. */
const MIN_FILL_MS = 3000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function splitContact(raw: string): { email: string | null; phone: string | null } {
  const value = raw.trim()
  return value.includes('@') ? { email: value, phone: null } : { email: null, phone: value }
}

/** Returns a message for the visitor, or null if the contact looks usable. */
function contactProblem(raw: string): string | null {
  const value = raw.trim()
  if (value.includes('@')) {
    return EMAIL.test(value) ? null : 'That email address doesn’t look right.'
  }
  // The CRM's phone column holds 40 characters; 7 to 15 digits covers every
  // real number, with or without a country code, spaces, dashes or brackets.
  const digits = value.replace(/\D/g, '')
  const onlyPhoneChars = /^[+\d\s\-().]+$/.test(value)
  return onlyPhoneChars && value.length <= 40 && digits.length >= 7 && digits.length <= 15
    ? null
    : 'Enter a valid email address or phone number.'
}

export function EnquiryForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const shownAt = useRef(Date.now())

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const data = new FormData(form)

    // Bots fill every field they can see in the markup, including the one a
    // person never sees. Answer them exactly as a success, so there is nothing
    // to learn from the response, and send nothing.
    const trapped = String(data.get('website') ?? '') !== ''
    if (trapped || Date.now() - shownAt.current < MIN_FILL_MS) {
      setStatus('success')
      return
    }

    if (!crm) {
      setStatus('error')
      return
    }

    const name = String(data.get('name') ?? '').trim()
    const contact = String(data.get('contact') ?? '')
    const bad = !name ? 'Please enter your name.' : contactProblem(contact)
    if (bad) {
      setProblem(bad)
      setStatus('idle')
      return
    }
    setProblem(null)

    const { email, phone } = splitContact(contact)
    setStatus('submitting')

    const { error } = await crm.from('leads').insert({
      name,
      business_name: String(data.get('business') ?? '').trim() || null,
      email,
      phone,
      remarks: String(data.get('message') ?? '').trim() || null,
      source: 'inbound',
    })

    if (error) {
      setStatus('error')
      return
    }
    setStatus('success')
    form.reset()
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-line bg-abyss/70 p-6" data-cursor-target>
        <p className="text-[0.95rem] text-ink">Got it. We&rsquo;ll get back to you shortly.</p>
      </div>
    )
  }

  const inputClasses =
    'w-full rounded-lg border border-line bg-abyss/70 px-3.5 py-3 text-[1rem] text-ink-dim sm:text-[0.9rem] outline-none transition-colors placeholder:text-faint focus:border-accent/60'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" data-cursor-target>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-name" className="sr-only">
            Name
          </label>
          <input
            id="enquiry-name"
            name="name"
            type="text"
            required
            maxLength={LIMITS.name}
            autoComplete="name"
            placeholder="Name"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="enquiry-contact" className="sr-only">
            Email or phone
          </label>
          <input
            id="enquiry-contact"
            name="contact"
            type="text"
            required
            maxLength={LIMITS.contact}
            autoComplete="email"
            placeholder="Email or phone"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-business" className="sr-only">
          Business name
        </label>
        <input
          id="enquiry-business"
          name="business"
          type="text"
          maxLength={LIMITS.business}
          autoComplete="organization"
          placeholder="Business name (optional)"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="enquiry-message" className="sr-only">
          What do you want to automate?
        </label>
        <textarea
          id="enquiry-message"
          name="message"
          rows={3}
          maxLength={LIMITS.message}
          placeholder="What do you want to automate? (optional)"
          className={`${inputClasses} resize-none`}
        />
      </div>

      {/* Honeypot. Off-screen rather than display:none, which some bots skip;
          aria-hidden and tabIndex keep it away from screen readers and the
          keyboard, and autoComplete=off keeps browsers from filling it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="enquiry-website">Website</label>
        <input
          id="enquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn btn-primary mt-1 self-start disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : "Let’s automate"}
      </button>

      {problem && (
        <p className="text-[0.82rem] text-accent" role="alert">
          {problem}
        </p>
      )}

      {status === 'error' && (
        <p className="text-[0.82rem] text-accent" role="alert">
          {crm
            ? 'Something went wrong sending that. Please try again, or email us directly below.'
            : 'The enquiry form isn’t configured yet. Please email us directly below.'}
        </p>
      )}
    </form>
  )
}
