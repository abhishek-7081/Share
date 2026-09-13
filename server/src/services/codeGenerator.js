import crypto from 'crypto';

export function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}

export async function generateUniqueCode(store, length = 6, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateNumericCode(length);
    const existing = await store.getSessionIdByCode(code);
    if (!existing) {
      return code;
    }
  }
  throw new Error('Failed to generate a unique sharing code. Please try again.');
}
