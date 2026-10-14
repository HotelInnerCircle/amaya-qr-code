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
