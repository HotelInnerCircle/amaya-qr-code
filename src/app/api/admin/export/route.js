import { getRegistrations } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function esc(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function GET() {
  try {
    const col = await getRegistrations();
    const docs = await col.find({}).sort({ createdAt: 1 }).toArray();

    const head = [
      'Name', 'Mobile', 'Email', 'Home Interest', 'Follow-up Consent',
      'Brochure Opened', 'Brochure Opened At', 'Source', 'Event', 'Registered At',
    ];
    const lines = [head.join(',')];
    for (const d of docs) {
      lines.push(
        [
          d.name,
          d.mobile,
          d.email,
          d.interest === 'Exploring' ? 'Still exploring' : d.interest,
          d.consentFollowup ? 'Yes' : 'No',
          d.brochureOpened ? 'Yes' : 'No',
          d.brochureOpenedAt ? new Date(d.brochureOpenedAt).toISOString() : '',
          d.src || '',
          d.event || '',
          d.createdAt ? new Date(d.createdAt).toISOString() : '',
        ]
          .map(esc)
          .join(',')
      );
    }

    // BOM so Excel opens it with correct encoding
    const csv = '﻿' + lines.join('\r\n');
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="amaya-registrations-${stamp}.csv"`,
      },
    });
  } catch (e) {
    console.error('export failed', e);
    return new Response('Export failed', { status: 500 });
  }
}
