import { NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const col = await getRegistrations();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(5000).toArray();
    const rows = docs.map((d) => ({
      id: d._id.toString(),
      name: d.name || '',
      mobile: d.mobile || '',
      email: d.email || '',
      interest: d.interest || '',
      consent: !!d.consentFollowup,
      brochureOpened: !!d.brochureOpened,
      brochureOpenedAt: d.brochureOpenedAt ? new Date(d.brochureOpenedAt).toISOString() : null,
      src: d.src || null,
      event: d.event || '',
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    }));
    return NextResponse.json({ rows });
  } catch (e) {
    console.error('registrations list failed', e);
    return NextResponse.json({ error: 'Could not load registrations.' }, { status: 500 });
  }
}
