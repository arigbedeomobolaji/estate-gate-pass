import crypto from 'node:crypto';
export { validTimeWindow, calcPermitCategory } from './permit-utils';

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function makePermitNumber(date: string) {
  return `EST-${date.replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
