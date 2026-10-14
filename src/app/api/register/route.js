import { NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const INTERESTS = ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', 'Exploring'];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const name = String(body.name || '').trim().slice(0, 120);
  const mobile = String(body.mobile || '').replace(/\D/g, '');
  const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
  const interest = String(body.interest || '');
  const consent = body.consent === true;
  const src = String(body.src || '').trim().slice(0, 60);

  const errors = {};
  if (name.length < 2) errors.name = 'Please enter the visitor’s name.';
  if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = 'Please enter a valid 10-digit mobile number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (!INTERESTS.includes(interest)) errors.interest = 'Please choose one option.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  try {
    const col = await getRegistrations();
    const result = await col.insertOne({
      name,
      mobile: '+91 ' + mobile,
      email,
      interest,
      consentFollowup: consent,
      brochureOpened: false,
      brochureOpenedAt: null,
      event: 'Exhibition',
      src: src || null,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: result.insertedId.toString() });
  } catch (e) {
    console.error('register insert failed', e);
    return NextResponse.json(
      { error: 'That didn’t save. Please try once more.' },
      { status: 500 }
    );
  }
}
