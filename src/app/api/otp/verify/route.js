import { NextResponse } from 'next/server';
import { normalise, validateMobile } from '@/lib/validate';
import { checkOtp, createVerifiedToken } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { mobile } = normalise({ mobile: body?.mobile });
  if (validateMobile(mobile)) {
    return NextResponse.json({ error: 'Please enter a valid mobile number first.' }, { status: 422 });
  }
  const code = String(body?.code || '').replace(/\D/g, '');

  try {
    const result = await checkOtp(mobile, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, token: await createVerifiedToken(mobile) });
  } catch (e) {
    console.error('otp verify route failed', e);
    return NextResponse.json({ error: 'We couldn’t check the code just now. Please try again.' }, { status: 500 });
  }
}
