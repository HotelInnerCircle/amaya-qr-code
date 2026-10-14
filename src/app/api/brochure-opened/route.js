import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getRegistrations } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const id = String(body.id || '');
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const col = await getRegistrations();
    await col.updateOne(
      { _id: new ObjectId(id), brochureOpened: { $ne: true } },
      { $set: { brochureOpened: true, brochureOpenedAt: new Date() } }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('brochure-opened update failed', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
