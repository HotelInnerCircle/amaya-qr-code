import { NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/mongodb';
import { validateRegistration } from '@/lib/validate';
import { isVerifiedToken } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { values, errors } = validateRegistration(body);
  const { name, mobile, email, interest } = values;
  const consent = body.consent === true;
  const src = String(body.src || '').trim().replace(/[^\w.-]/g, '').slice(0, 60);

  if (!errors.mobile && !(await isVerifiedToken(body.otpToken, mobile))) {
    errors.mobile = 'Please verify this mobile number with the WhatsApp code.';
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  try {
    const col = await getRegistrations();
    const result = await col.insertOne({
      name,
      mobile: '+91 ' + mobile,
      mobileVerified: true,
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
