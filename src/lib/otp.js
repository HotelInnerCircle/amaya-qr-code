import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '@/lib/mongodb';

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000; // code is valid for 5 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000; // wait 30s between sends
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

function hashCode(mobile, code) {
  return createHmac('sha256', secret()).update(`${mobile}:${code}`).digest('hex');
}

let indexesReady = false;
async function otps() {
  const col = (await getDb()).collection('otps');
  if (!indexesReady) {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await col.createIndex({ mobile: 1 });
    indexesReady = true;
  }
  return col;
}

async function sendWhatsApp(mobile, code) {
  const apiKey = process.env.CHAT360_API_KEY;
  const clientNumber = process.env.CHAT360_CLIENT_NUMBER;
  if (!apiKey || !clientNumber) throw new Error('CHAT360_API_KEY / CHAT360_CLIENT_NUMBER are not set');

  const res = await fetch('https://app.chat360.io/service/v2/task', {
    method: 'POST',
    headers: { Authorization: `Api-Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_name: 'whatsapp_push_notification',
      extra: '',
      task_body: [
        {
          client_number: clientNumber,
          receiver_number: mobile,
          country_code: '+91',
          template_data: {
            param_data: { OTP: code },
            template_title: process.env.CHAT360_OTP_TEMPLATE || 'amaya_whatsapp_otp',
            template_code: 'en',
            button_param_data: { [code]: code },
          },
        },
      ],
    }),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Chat360 ${res.status}: ${text.slice(0, 300)}`);
  return text;
}

// Returns { ok: true } or { ok: false, status, error, retryAfter? }.
export async function sendOtp(mobile) {
  const col = await otps();
  const now = Date.now();

  const recent = await col
    .find({ mobile, createdAt: { $gt: new Date(now - 60 * 60 * 1000) } })
    .sort({ createdAt: -1 })
    .toArray();

  if (recent[0] && now - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - recent[0].createdAt.getTime())) / 1000);
    return { ok: false, status: 429, error: `Please wait ${retryAfter}s before requesting another code.`, retryAfter };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, status: 429, error: 'Too many codes requested for this number. Please try again in an hour.' };
  }

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  // Keep the expired/used rows for the hourly limit, but only the newest code is valid.
  await col.updateMany({ mobile, used: false }, { $set: { used: true } });
  const { insertedId } = await col.insertOne({
    mobile,
    codeHash: hashCode(mobile, code),
    attempts: 0,
    used: false,
    createdAt: new Date(now),
    // keep the row an hour so the send limit above still counts it
    expiresAt: new Date(now + 60 * 60 * 1000),
    validUntil: new Date(now + OTP_TTL_MS),
  });

  try {
    await sendWhatsApp(mobile, code);
  } catch (e) {
    console.error('OTP send failed', e);
    await col.deleteOne({ _id: insertedId });
    return { ok: false, status: 502, error: 'We couldn’t send the WhatsApp code just now. Please try again.' };
  }
  return { ok: true };
}

// Returns { ok: true } or { ok: false, status, error }.
export async function checkOtp(mobile, code) {
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return { ok: false, status: 422, error: `Please enter the ${OTP_LENGTH}-digit code.` };
  }
  const col = await otps();
  const row = await col.findOne({ mobile, used: false }, { sort: { createdAt: -1 } });

  if (!row) {
    return { ok: false, status: 410, error: 'Please request a code first.' };
  }
  if (row.validUntil.getTime() < Date.now()) {
    return { ok: false, status: 410, error: 'That code has expired. Please request a new one.' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, status: 429, error: 'Too many wrong attempts. Please request a new code.' };
  }

  const expected = Buffer.from(row.codeHash, 'hex');
  const actual = Buffer.from(hashCode(mobile, code), 'hex');
  if (!timingSafeEqual(expected, actual)) {
    await col.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      status: 422,
      error: left > 0 ? `That code isn’t right. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong attempts. Please request a new code.',
    };
  }

  await col.updateOne({ _id: row._id }, { $set: { used: true } });
  return { ok: true };
}

// Short-lived proof that a mobile number was verified, handed to the form
// and checked again by /api/register.
const enc = () => new TextEncoder().encode(secret());

export async function createVerifiedToken(mobile) {
  return new SignJWT({ mobile, purpose: 'mobile-verified' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(enc());
}

export async function isVerifiedToken(token, mobile) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(String(token), enc());
    return payload.purpose === 'mobile-verified' && payload.mobile === mobile;
  } catch {
    return false;
  }
}
