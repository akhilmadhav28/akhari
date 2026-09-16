import { useState, type FormEvent } from 'react'
import { crm } from '@/lib/crm/client'

/**
 * Replaces the mailto/tel buttons in `CTA` with a real form that writes
 * straight into the Akhari CRM's `leads` table (see `lib/crm/client.ts`) —
 * no backend of this site's own, no intermediate service.
 *
 * The single "email or phone" field is split heuristically before insert:
 * anything with an `@` goes to `email`, everything else to `phone`. The CRM's
 * board doesn't care which one is empty; it just needs a way to reach back.
 */

type Status = 'idle' | 'submitting' | 'success' | 'error'

function splitContact(raw: string): { email: string | null; phone: string | null } {
  const value = raw.trim()
  return value.includes('@') ? { email: value, phone: null } : { email: null, phone: value }
}

export function EnquiryForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!crm) {
      setStatus('error')
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)
    const { email, phone } = splitContact(String(data.get('contact') ?? ''))
    setStatus('submitting')

    const { error } = await crm.from('leads').insert({
      name: String(data.get('name') ?? ''),
      business_name: (data.get('business') as string) || null,
      email,
      phone,
      remarks: (data.get('message') as string) || null,
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
    'w-full rounded-lg border border-line bg-abyss/70 px-3.5 py-3 text-[0.9rem] text-ink-dim outline-none transition-colors placeholder:text-faint focus:border-accent/60'

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
          placeholder="What do you want to automate? (optional)"
          className={`${inputClasses} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn btn-primary mt-1 self-start disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : "Let’s automate"}
      </button>

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
