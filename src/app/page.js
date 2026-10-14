'use client';

import { useEffect, useState } from 'react';

const INTERESTS = ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', 'Exploring'];
const BROCHURE_PATH = '/brochure/Amaya-eBrochure.pdf';

const FACTS = [
  '256 thoughtfully designed homes',
  'Beside a 700-acre reserve forest',
  '35,000+ sq. ft. of wellness spaces',
  'Medchal, Hyderabad',
];

export default function RegistrationPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [doneId, setDoneId] = useState(null);
  const [doneName, setDoneName] = useState('');
  const [src, setSrc] = useState('');

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      setSrc(p.get('src') || '');
    } catch {
      /* no-op */
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
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
    setDoneId(null);
    setDoneName('');
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="min-h-screen">
      {/* Navy header band */}
      <header className="bg-navy text-paper">
        <div className="mx-auto max-w-2xl px-4 py-9 text-center">
          <p className="font-display text-5xl font-medium tracking-[0.22em] [text-indent:0.22em]">AMAYA</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-limestone">
            Senior Living &middot; by Vera Vita
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
            <h1 className="font-display text-3xl font-semibold text-navy [text-wrap:balance]">
              Welcome to Amaya
            </h1>
            <p className="mb-6 mt-1 text-[15px] text-ink-soft">
              Share your details and we&rsquo;ll have the e&#8209;brochure ready for you straight away.
            </p>

            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="name">Full name</label>
                <input
                  id="name" type="text" autoComplete="name" placeholder="Your name"
                  className="input" value={name} onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-[13.5px] text-red-800">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="mobile">Mobile number</label>
                <div className="flex gap-2">
                  <span className="flex items-center rounded-lg border border-stone bg-mist px-3 text-ink-soft">+91</span>
                  <input
                    id="mobile" type="tel" inputMode="numeric" maxLength={10}
                    autoComplete="tel-national" placeholder="10-digit mobile"
                    className="input flex-1" value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                {errors.mobile && <p className="text-[13.5px] text-red-800">{errors.mobile}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flabel" htmlFor="email">Email</label>
                <input
                  id="email" type="email" autoComplete="email" placeholder="name@example.com"
                  className="input" value={email} onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-[13.5px] text-red-800">{errors.email}</p>}
              </div>

              <fieldset className="flex flex-col gap-1.5">
                <legend className="flabel mb-1.5">I&rsquo;m interested in</legend>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((v) => (
                    <label key={v} className="cursor-pointer">
                      <input
                        type="radio" name="interest" value={v} className="peer sr-only"
                        checked={interest === v} onChange={() => setInterest(v)}
                      />
                      <span className="inline-block rounded-full border border-stone bg-paper px-4 py-2 text-[14.5px] text-ink transition peer-checked:border-navy peer-checked:bg-navy peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-brass">
                        {v === 'Exploring' ? 'Still exploring' : v}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.interest && <p className="text-[13.5px] text-red-800">{errors.interest}</p>}
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

              {errors.save && <p className="text-[13.5px] text-red-800">{errors.save}</p>}

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
