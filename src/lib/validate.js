// Shared by the registration form (client) and /api/register (server),
// so both always apply the same rules.

export const INTERESTS = ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', 'Exploring'];

export const LIMITS = { nameMin: 2, nameMax: 80, emailMax: 160 };

const NAME_RE = /^[\p{L}][\p{L}\p{M}'’ .-]*$/u;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;

export function normalise(input) {
  return {
    name: String(input.name || '').trim().replace(/\s+/g, ' '),
    mobile: String(input.mobile || '').replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, ''),
    email: String(input.email || '').trim().toLowerCase(),
    interest: String(input.interest || ''),
  };
}

export function validateName(name) {
  if (!name) return 'Please enter the visitor’s name.';
  if (name.length < LIMITS.nameMin) return 'The name looks too short.';
  if (name.length > LIMITS.nameMax) return `Please keep the name under ${LIMITS.nameMax} characters.`;
  if (!NAME_RE.test(name)) return 'Please use letters only (spaces, full stops, hyphens and apostrophes are fine).';
  return '';
}

export function validateMobile(mobile) {
  if (!mobile) return 'Please enter a mobile number.';
  if (mobile.length !== 10) return 'The mobile number should be 10 digits.';
  if (!/^[6-9]/.test(mobile)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  if (/^(\d)\1{9}$/.test(mobile)) return 'Please enter a real mobile number.';
  return '';
}

export function validateEmail(email) {
  if (!email) return 'Please enter an email address.';
  if (email.length > LIMITS.emailMax) return 'That email address is too long.';
  if (!EMAIL_RE.test(email) || email.includes('..')) return 'Please enter a valid email address, e.g. name@example.com.';
  const suggestion = suggestEmail(email);
  if (suggestion) return `That email doesn’t look right. Did you mean ${suggestion}?`;
  if (BAD_TLDS.has(email.split('.').pop())) return 'Please check the end of the email address (e.g. .com, .in, .org).';
  return '';
}

// Real domains of popular mail providers. Anything that is a near-miss of one
// of these (gmail.con, gmial.com, yahoo.co, hotmail.cm …) is treated as a typo.
const KNOWN_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.in', 'ymail.com',
  'hotmail.com', 'outlook.com', 'outlook.in', 'live.com', 'live.in', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'rediffmail.com', 'aol.com',
  'protonmail.com', 'proton.me', 'zoho.com', 'zohomail.in',
  // Real domains that sit close to the above — listed so they aren't "corrected".
  'yahoo.co.uk', 'hotmail.co.uk', 'live.co.uk', 'mail.com', 'email.com', 'gmx.com', 'yandex.com',
];
const KNOWN_SET = new Set(KNOWN_DOMAINS);

// Endings that are never real and are almost always a mistyped .com / .net / .org / .in.
const BAD_TLDS = new Set([
  'con', 'cmo', 'ocm', 'comm', 'coom', 'comn', 'coml', 'cpm', 'cim', 'clm', 'vom', 'xom', 'cok', 'cmm',
  'nte', 'nett', 'ner', 'ogr', 'orgg', 'prg', 'inn',
]);

function editDistance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

// Returns a corrected email address if the domain looks like a typo of a
// well-known provider, otherwise ''.
export function suggestEmail(email) {
  const at = email.lastIndexOf('@');
  if (at < 1) return '';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (KNOWN_SET.has(domain)) return '';

  let best = '';
  let bestDist = Infinity;
  for (const d of KNOWN_DOMAINS) {
    const dist = editDistance(domain, d);
    if (dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  // Allow up to 2 slips for longer domains, 1 for short ones (me.com, aol.com).
  const allowed = best.length >= 8 ? 2 : 1;
  if (bestDist > 0 && bestDist <= allowed) return `${local}@${best}`;

  // e.g. company.con → company.com
  const tld = domain.split('.').pop();
  if (BAD_TLDS.has(tld)) {
    const fix = /^n/.test(tld) ? 'net' : /^[op]/.test(tld) ? 'org' : /^i/.test(tld) ? 'in' : 'com';
    return `${local}@${domain.slice(0, -tld.length)}${fix}`;
  }
  return '';
}

export function validateInterest(interest) {
  return INTERESTS.includes(interest) ? '' : 'Please choose one option.';
}

const VALIDATORS = {
  name: validateName,
  mobile: validateMobile,
  email: validateEmail,
  interest: validateInterest,
};

export function validateField(field, value) {
  return VALIDATORS[field] ? VALIDATORS[field](normalise({ [field]: value })[field]) : '';
}

// Returns { values, errors } — errors is empty when everything is valid.
export function validateRegistration(input) {
  const values = normalise(input);
  const errors = {};
  for (const [field, fn] of Object.entries(VALIDATORS)) {
    const msg = fn(values[field]);
    if (msg) errors[field] = msg;
  }
  return { values, errors };
}
