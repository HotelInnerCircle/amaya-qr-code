'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERESTS = ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', 'Exploring'];
const label = (k) => (k === 'Exploring' ? 'Still exploring' : k);

export default function AdminDashboard() {
  const router = useRouter();
  const [rows, setRows] = useState(null); // null = loading
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registrations', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.rows)) {
        setRows(data.rows);
        setUpdatedAt(new Date());
        setError('');
      } else {
        setError(data.error || 'Could not load registrations.');
      }
    } catch {
      setError('Connection lost — retrying…');
    }
  }, [router]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 10000);
    return () => clearInterval(timer.current);
  }, [load]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.replace('/admin/login');
  }

  const data = rows || [];
  const total = data.length;
  const todayKey = new Date().toLocaleDateString('en-CA');
  const today = data.filter(
    (r) => r.createdAt && new Date(r.createdAt).toLocaleDateString('en-CA') === todayKey
  ).length;
  const opens = data.filter((r) => r.brochureOpened).length;
  const consents = data.filter((r) => r.consent).length;
  const pct = (n) => (total ? Math.round((100 * n) / total) + '%' : '');

  const counts = {};
  INTERESTS.forEach((k) => (counts[k] = 0));
  data.forEach((r) => {
    counts[r.interest] = (counts[r.interest] || 0) + 1;
  });
  const keys = [...INTERESTS, ...Object.keys(counts).filter((k) => !INTERESTS.includes(k))];
  const max = Math.max(1, ...keys.map((k) => counts[k] || 0));

  const recent = data.slice(0, 20);

  return (
    <main className="min-h-screen">
      <header className="bg-navy text-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div>
            <p className="font-display text-2xl font-medium tracking-[0.18em] [text-indent:0.18em]">AMAYA</p>
            <p className="text-[10px] uppercase tracking-[0.26em] text-limestone">Exhibition dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-limestone underline">Registration form</a>
            <a href="/api/admin/export" className="btn-brass !px-5 !py-2 text-xs">Export CSV</a>
            <button onClick={logout} className="rounded-full border border-limestone/60 px-4 py-2 text-xs uppercase tracking-wider text-limestone transition hover:bg-navy-deep">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 pb-10">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-[26px] font-semibold text-navy">Live overview</h1>
          <span className="text-[13px] text-ink-faint">
            {error
              ? error
              : updatedAt
                ? 'Live · updated ' + updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Loading…'}
          </span>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile num={total} label="Registrations" />
          <Tile num={today} label="Today" />
          <Tile num={opens} sub={pct(opens)} label="Brochure opens" />
          <Tile num={consents} sub={pct(consents)} label="Follow-up opt-ins" />
        </div>

        {/* Interest bars */}
        <section className="card p-5">
          <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.1em] text-navy">
            Enquiries by home interest
          </h2>
          <div className="flex flex-col gap-2.5">
            {keys.map((k) => (
              <div key={k} className="grid grid-cols-[110px_1fr_44px] items-center gap-2.5">
                <span className="text-[13.5px] text-ink">{label(k)}</span>
                <div className="h-[18px] rounded bg-mist">
                  <div
                    className="h-[18px] rounded bg-navy transition-all"
                    style={{ width: `${((counts[k] || 0) / max) * 100}%` }}
                  />
                </div>
                <span className="text-right text-[13.5px] tabular-nums text-ink">{counts[k] || 0}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent registrations */}
        <section className="card p-5">
          <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.1em] text-navy">
            Recent registrations
          </h2>
          {rows === null ? (
            <p className="py-4 text-center text-sm text-ink-faint">Loading&hellip;</p>
          ) : total === 0 ? (
            <p className="py-4 text-center text-sm text-ink-faint">
              No registrations yet. They&rsquo;ll appear here live as visitors register.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>
                    {['Name', 'Mobile', 'Email', 'Interest', 'Opt-in', 'Brochure', 'Source', 'Time'].map((h) => (
                      <th key={h} className="whitespace-nowrap border-b border-stone px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2">{r.name}</td>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2 tabular-nums">{r.mobile}</td>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2">{r.email}</td>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2">{label(r.interest)}</td>
                      <td className={'whitespace-nowrap border-b border-mist px-2.5 py-2 ' + (r.consent ? 'text-sage' : '')}>
                        {r.consent ? 'Yes' : '—'}
                      </td>
                      <td className={'whitespace-nowrap border-b border-mist px-2.5 py-2 ' + (r.brochureOpened ? 'text-sage' : '')}>
                        {r.brochureOpened ? 'Opened' : '—'}
                      </td>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2 text-ink-faint">{r.src || '—'}</td>
                      <td className="whitespace-nowrap border-b border-mist px-2.5 py-2 text-ink-faint">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
                            ', ' +
                            new Date(r.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Tile({ num, sub, label }) {
  return (
    <div className="card px-4 py-4">
      <div className="text-[32px] font-medium leading-tight tabular-nums text-navy">
        {num}
        {sub ? <small className="ml-1 text-[14px] font-normal text-brass">{sub}</small> : null}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
    </div>
  );
}
