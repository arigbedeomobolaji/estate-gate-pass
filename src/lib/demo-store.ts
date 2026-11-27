import crypto from 'node:crypto';
import type { Gate, Permit, Role, User } from './types';

type Visit = NonNullable<Permit['visit']> & { permitId: string; denialReason?: string };
const gates: Gate[] = [
  { id: 'gate-main', name: 'Main Gate', active: true, description: 'Primary visitor entrance' },
  { id: 'gate-2', name: 'Gate 2', active: true, description: 'Secondary entrance' },
  { id: 'gate-service', name: 'Service Gate', active: true, description: 'Service and deliveries' },
];
const users: User[] = [
  { id: 'u-resident', email: process.env.DEMO_RESIDENT_EMAIL || 'resident@example.com', fullName: 'Ibrahim Musa', role: 'RESIDENT', userType: 'PERSONNEL', serviceNumber: 'NAF/12345', mustChangePassword: false, active: true, resident: { id: 'r1', houseNumber: 'Block B, Flat 12', phone: '08030000001' } },
  { id: 'u-guard', email: process.env.DEMO_GUARD_EMAIL || 'guard@example.com', fullName: 'Musa Ibrahim', role: 'GUARD', userType: 'PERSONNEL', serviceNumber: 'NAF/67890', mustChangePassword: false, active: true, guard: { id: 'g1', assignedGateId: 'gate-main' } },
  { id: 'u-admin', email: process.env.DEMO_ADMIN_EMAIL || 'admin@example.com', fullName: 'NAF Base Administrator', role: 'ADMIN', userType: 'PERSONNEL', mustChangePassword: false, active: true },
];
const permits: Permit[] = [];
const visits = new Map<string, Visit>();
const notifications: { id: string; userId: string; title: string; message: string; createdAt: string; read: boolean }[] = [];
const audits: { id: string; userId?: string; action: string; targetId: string; createdAt: string }[] = [];

export function demoLogin(identifier: string, password: string) {
  if (password !== (process.env.DEMO_PASSWORD || 'ChangeMe123!')) return null;
  const id = identifier.toLowerCase();
  return users.find(u => u.active && (u.email.toLowerCase() === id || u.serviceNumber?.toUpperCase() === identifier.toUpperCase())) || null;
}
export function getDemoUser(id: string) { return users.find(u => u.id === id) || null; }
export function getDemoGates() { return gates.filter(g => g.active); }
export function listDemoPermits(user: User) { return user.role === 'RESIDENT' ? permits.filter(p => p.resident.id === user.resident?.id) : permits; }
export function createDemoPermit(user: User, input: { fullName: string; phone: string; purpose: string; visitDate: string; startTime: string; endTime: string; vehicleRegistration?: string; vehicleType?: string }) {
  const token = crypto.randomBytes(32).toString('base64url');
  const date = input.visitDate.replaceAll('-', '');
  const permit: Permit = { id: crypto.randomUUID(), permitNumber: `EST-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, qrToken: token, visitor: { id: crypto.randomUUID(), fullName: input.fullName, phone: input.phone }, resident: { id: user.resident!.id, fullName: user.fullName, houseNumber: user.resident!.houseNumber }, purpose: input.purpose, visitDate: input.visitDate, startTime: input.startTime, endTime: input.endTime, vehicleRegistration: input.vehicleRegistration, vehicleType: input.vehicleType, status: 'APPROVED' };
  permit.visit = { id: crypto.randomUUID(), status: 'EXPECTED' };
  permits.unshift(permit);
  visits.set(permit.id, { ...permit.visit, permitId: permit.id });
  audits.unshift({ id: crypto.randomUUID(), userId: user.id, action: 'CREATE_PERMIT', targetId: permit.id, createdAt: new Date().toISOString() });
  return permit;
}
export function cancelDemoPermit(user: User, id: string) {
  const p = permits.find(x => x.id === id && x.resident.id === user.resident?.id);
  if (!p || p.status === 'CANCELLED') return false;
  p.status = 'CANCELLED';
  audits.unshift({ id: crypto.randomUUID(), userId: user.id, action: 'CANCEL_PERMIT', targetId: id, createdAt: new Date().toISOString() });
  return true;
}
function timeState(p: Permit) {
  const now = new Date(); const today = now.toISOString().slice(0, 10);
  if (p.status === 'CANCELLED') return { ok: false, code: 'CANCELLED' };
  if (today < p.visitDate) return { ok: false, code: 'NOT_YET_VALID' };
  if (today > p.visitDate) return { ok: false, code: 'EXPIRED' };
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = Number(p.startTime.slice(0, 2)) * 60 + Number(p.startTime.slice(3));
  const end = Number(p.endTime.slice(0, 2)) * 60 + Number(p.endTime.slice(3));
  if (mins < start) return { ok: false, code: 'NOT_YET_VALID' };
  if (mins > end) return { ok: false, code: 'EXPIRED' };
  if (p.visit?.status === 'INSIDE') return { ok: false, code: 'ALREADY_USED' };
  if (p.visit?.status === 'EXITED') return { ok: false, code: 'ALREADY_USED' };
  return { ok: true, code: 'VALID' };
}
export function verifyDemoPermit(tokenOrNumber: string) {
  const p = permits.find(x => x.permitNumber === tokenOrNumber || x.qrToken === tokenOrNumber);
  if (!p) return { ok: false, code: 'NOT_FOUND' };
  const state = timeState(p);
  return { ok: state.ok, code: state.code, permit: p };
}
export function grantDemoEntry(user: User, pid: string, gateId: string) {
  const p = permits.find(x => x.id === pid);
  if (!p) return { ok: false, error: 'Permit not found' };
  const state = timeState(p);
  if (!state.ok) return { ok: false, error: state.code };
  const gate = gates.find(g => g.id === gateId);
  p.visit = { ...p.visit!, status: 'INSIDE', entryAt: new Date().toISOString(), entryGate: gate?.name };
  visits.set(pid, { ...p.visit!, permitId: pid });
  notifications.unshift({ id: crypto.randomUUID(), userId: 'u-resident', title: 'Visitor arrived', message: `Your visitor ${p.visitor.fullName} has arrived at ${gate?.name || 'the gate'}.`, createdAt: new Date().toISOString(), read: false });
  audits.unshift({ id: crypto.randomUUID(), userId: user.id, action: 'GRANT_ENTRY', targetId: pid, createdAt: new Date().toISOString() });
  return { ok: true, permit: p };
}
export function denyDemoEntry(user: User, pid: string, reason: string) {
  const p = permits.find(x => x.id === pid);
  if (!p) return false;
  p.visit = { ...p.visit!, status: 'DENIED' };
  audits.unshift({ id: crypto.randomUUID(), userId: user.id, action: 'DENY_ENTRY', targetId: pid, createdAt: new Date().toISOString() });
  return true;
}
export function exitDemo(user: User, pid: string, gateId: string) {
  const p = permits.find(x => x.id === pid);
  if (!p || p.visit?.status !== 'INSIDE') return false;
  const gate = gates.find(g => g.id === gateId);
  p.visit = { ...p.visit, status: 'EXITED', exitAt: new Date().toISOString(), exitGate: gate?.name };
  visits.set(pid, { ...p.visit!, permitId: pid });
  audits.unshift({ id: crypto.randomUUID(), userId: user.id, action: 'RECORD_EXIT', targetId: pid, createdAt: new Date().toISOString() });
  return true;
}
export function demoStats() { return { visitorsToday: 742, expected: 831, currentInside: permits.filter(p => p.visit?.status === 'INSIDE').length + 183, entries: 742, exits: 559, activePermits: permits.filter(p => p.status === 'APPROVED').length + 214 }; }
export function demoNotifications(userId: string) { return notifications.filter(n => n.userId === userId).slice(0, 20); }
export function demoAudits() { return audits.slice(0, 100); }
