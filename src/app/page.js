'use client';

import { useEffect, useRef, useState } from 'react';
import { INTERESTS, LIMITS, normalise, suggestEmail, validateField, validateRegistration } from '@/lib/validate';

const BROCHURE_PATH = '/brochure/Amaya-eBrochure.pdf';
const FIELD_ORDER = ['name', 'mobile', 'email', 'interest'];

const FACTS = [
  '256 thoughtfully designed homes',
  'Beside a 700-acre reserve forest',
  '35,000+ sq. ft. of wellness spaces',
  'Medchal, Hyderabad',
];

function FieldError({ id, msg }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="text-[13.5px] text-red-800">
      {msg}
    </p>
  );
}

export default function RegistrationPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [doneId, setDoneId] = useState(null);
  const [doneName, setDoneName] = useState('');
  const [src, setSrc] = useState('');
  const refs = { name: useRef(null), mobile: useRef(null), email: useRef(null), interest: useRef(null) };

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      setSrc(p.get('src') || '');
    } catch {
      /* no-op */
    }
  }, []);

  // Re-check a field as the visitor types, but only once they've left it once
  // (so we don't shout at them before they've finished typing).
  function update(field, value, setter) {
    setter(value);
    if (touched[field] || errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }

  function blur(field, value) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  }

  function onMobileChange(raw) {
    let digits = raw.replace(/\D/g, '');
    // Handle pasted numbers such as "+91 98765 43210" or "098765 43210".
    if (digits.length > 10) digits = digits.replace(/^(?:91|0)/, '');
    update('mobile', digits.slice(0, 10), setMobile);
  }

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first && refs[first].current) {
      refs[first].current.focus();
      refs[first].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    const { errors: clientErrors } = validateRegistration({ name, mobile, email, interest });
    setTouched({ name: true, mobile: true, email: true, interest: true });
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, interest, consent, src }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        setDoneId(data.id);
        setDoneName(name.trim().split(/\s+/)[0]);
        window.scrollTo({ top: 0 });
      } else if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        focusFirstError(data.errors);
      } else {
        setErrors({ save: data.error || 'That didn’t save. Please check the connection and try once more.' });
      }
    } catch {
      setErrors({ save: 'That didn’t save. Please check the connection and try once more.' });
    } finally {
      setSaving(false);
    }
  }

  function brochureClicked() {
    if (doneId) {
      fetch('/api/brochure-opened', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doneId }),
      }).catch(() => {});
    }
  }

  function registerAnother() {
    setName('');
    setMobile('');
    setEmail('');
    setInterest('');
    setConsent(false);
    setErrors({});
    setTouched({});
    setDoneId(null);
    setDoneName('');
    window.scrollTo({ top: 0 });
  }

  const emailSuggestion = errors.email ? suggestEmail(normalise({ email }).email) : '';
  const invalid = (f) => (errors[f] ? 'input-error' : '');
  const aria = (f) => ({
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': errors[f] ? `${f}-error` : undefined,
  });

  return (
    <main className="min-h-screen">
      {/* Navy header band */}
      <header className="bg-navy text-paper">
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          <h1 className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Amaya_black_Logo.webp"
              alt="Amaya Senior Living"
              width={3925}
              height={1973}
              className="mx-auto h-auto w-48 brightness-0 invert sm:w-56"
            />
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-limestone">
            by Vera Vita
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-7 pb-10">
        {/* Fact chips */}
        <div className="flex flex-wrap justify-center gap-2" aria-label="About Amaya">
          {FACTS.map((f) => (
            <span
              key={f}
              className="whitespace-nowrap rounded-full border border-stone bg-paper px-3.5 py-1.5 text-[12.5px] tracking-wide text-navy"
            >
              {f}
            </span>
          ))}
        </div>

        {!doneId ? (
          <section className="card px-6 py-7">
            <h2 className="font-display text-3xl font-semibold text-navy [text-wrap:balance]">
              Welcome to Amaya
            </h2>
            <p className="mb-6 mt-1 text-[15px] text-ink-soft">
              Share your details and we&rsquo;ll have the e&#8209;brochure ready for you straight away.
            </p>

            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="name">Full name <span className="text-red-800">*</span></label>
                <input
                  ref={refs.name}
                  id="name" type="text" autoComplete="name" placeholder="Your name"
                  required maxLength={LIMITS.nameMax}
                  className={`input ${invalid('name')}`} value={name}
                  onChange={(e) => update('name', e.target.value, setName)}
                  onBlur={(e) => blur('name', e.target.value)}
                  {...aria('name')}
                />
                <FieldError id="name-error" msg={errors.name} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="mobile">Mobile number <span className="text-red-800">*</span></label>
                <div className="flex gap-2">
                  <span className="flex items-center rounded-lg border border-stone bg-mist px-3 text-ink-soft">+91</span>
                  <input
                    ref={refs.mobile}
                    id="mobile" type="tel" inputMode="numeric" required
                    autoComplete="tel-national" placeholder="10-digit mobile"
                    className={`input flex-1 ${invalid('mobile')}`} value={mobile}
                    onChange={(e) => onMobileChange(e.target.value)}
                    onBlur={(e) => blur('mobile', e.target.value)}
                    {...aria('mobile')}
                  />
                </div>
                <FieldError id="mobile-error" msg={errors.mobile} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="email">Email <span className="text-red-800">*</span></label>
                <input
                  ref={refs.email}
                  id="email" type="email" autoComplete="email" placeholder="name@example.com"
                  required maxLength={LIMITS.emailMax} autoCapitalize="none" spellCheck={false}
                  className={`input ${invalid('email')}`} value={email}
                  onChange={(e) => update('email', e.target.value.replace(/\s/g, ''), setEmail)}
                  onBlur={(e) => blur('email', e.target.value)}
                  {...aria('email')}
                />
                <FieldError id="email-error" msg={errors.email} />
                {emailSuggestion && (
                  <button
                    type="button"
                    className="self-start text-[13.5px] font-medium text-navy underline"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  >
                    Use {emailSuggestion}
                  </button>
                )}
              </div>

              <fieldset className="flex flex-col gap-1.5" {...aria('interest')}>
                <legend className="flabel mb-1.5">I&rsquo;m interested in <span className="text-red-800">*</span></legend>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((v, i) => (
                    <label key={v} className="cursor-pointer">
                      <input
                        ref={i === 0 ? refs.interest : undefined}
                        type="radio" name="interest" value={v} className="peer sr-only"
                        checked={interest === v}
                        onChange={() => {
                          setInterest(v);
                          setErrors((prev) => ({ ...prev, interest: '' }));
                        }}
                      />
                      <span
                        className={`inline-block rounded-full border bg-paper px-4 py-2 text-[14.5px] text-ink transition peer-checked:border-navy peer-checked:bg-navy peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-brass ${
                          errors.interest ? 'border-red-700' : 'border-stone'
                        }`}
                      >
                        {v === 'Exploring' ? 'Still exploring' : v}
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError id="interest-error" msg={errors.interest} />
              </fieldset>

              <label className="flex items-start gap-2.5 rounded-xl bg-mist p-3.5">
                <input
                  type="checkbox" className="mt-0.5 h-4 w-4 accent-navy"
                  checked={consent} onChange={(e) => setConsent(e.target.checked)}
                />
                <span className="text-sm text-ink-soft">
                  I&rsquo;m happy to receive updates about Amaya on WhatsApp or email. Entirely optional &mdash; you can change your mind at any time.
                </span>
              </label>

              {errors.save && <p role="alert" className="text-[13.5px] text-red-800">{errors.save}</p>}

              <button type="submit" className="btn-primary mt-1" disabled={saving}>
                {saving ? 'Saving…' : 'Register'}
              </button>
            </form>
          </section>
        ) : (
          <section className="card px-6 py-9 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-2xl text-paper" aria-hidden="true">
              &#10003;
            </div>
            <h2 className="font-display text-[28px] font-semibold text-navy [text-wrap:balance]">
              Thank you, {doneName}.
            </h2>
            <p className="mb-5 mt-2 text-[15px] text-ink-soft">
              Your e-brochure is ready below. Do take your time with it.
            </p>
            <a
              href={BROCHURE_PATH}
              target="_blank"
              rel="noopener"
              className="btn-brass"
              onClick={brochureClicked}
            >
              Download Brochure
            </a>
            <button
              type="button"
              onClick={registerAnother}
              className="mx-auto mt-5 block text-sm text-navy underline"
            >
              Register another visitor
            </button>
          </section>
        )}

        <footer className="flex flex-col gap-1 text-center text-[12.5px] text-ink-faint">
          <span className="font-display text-[17px] italic text-navy">
            Where life finds its perfect rhythm.
          </span>
          <span>Amaya by Vera Vita &middot; Medchal, Hyderabad &middot; RERA No. TG RERA P02200011109</span>
        </footer>
      </div>
    </main>
  );
}
