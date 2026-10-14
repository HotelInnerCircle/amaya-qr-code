'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Sign-in failed. Please try again.');
      }
    } catch {
      setError('Sign-in failed. Please check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-navy">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center text-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Amaya_black_Logo.webp"
            alt="Amaya Senior Living"
            width={3925}
            height={1973}
            className="mx-auto h-auto w-44 brightness-0 invert"
          />
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-limestone">
            by Vera Vita
          </p>
        </div>

        <section className="card px-6 py-7">
          <h1 className="font-display text-2xl font-semibold text-navy">Team sign-in</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">
            The exhibition dashboard is for the Amaya team only.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="flabel" htmlFor="email">Email</label>
              <input
                id="email" type="email" autoComplete="username" className="input"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flabel" htmlFor="password">Password</label>
              <input
                id="password" type="password" autoComplete="current-password" className="input"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            {error && <p className="text-[13.5px] text-red-800">{error}</p>}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-[12.5px] text-limestone/80">
          Where life finds its perfect rhythm.
        </p>
      </div>
    </main>
  );
}
