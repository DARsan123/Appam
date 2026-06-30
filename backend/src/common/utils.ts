import { createHash } from 'crypto';

export function hashChain(previousHash: string | null, payload: string): string {
  const input = `${previousHash ?? 'genesis'}:${payload}`;
  return createHash('sha256').update(input).digest('hex');
}

export function generateQrToken(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .slice(0, 32);
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
