import { NextResponse } from 'next/server';
import { normalise, validateMobile } from '@/lib/validate';
import { sendOtp } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { mobile } = normalise({ mobile: body?.mobile });
  const mobileError = validateMobile(mobile);
  if (mobileError) {
    return NextResponse.json({ errors: { mobile: mobileError } }, { status: 422 });
  }

  try {
    const result = await sendOtp(mobile);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, retryAfter: result.retryAfter }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('otp send route failed', e);
    return NextResponse.json({ error: 'We couldn’t send the code just now. Please try again.' }, { status: 500 });
  }
}
