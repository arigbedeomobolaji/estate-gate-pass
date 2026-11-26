'use client';
import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function PushOptIn() {
  const [state, setState] = useState<'idle' | 'prompt' | 'subscribing' | 'done' | 'denied' | 'unsupported'>('idle');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') { setState('denied'); return; }
    if (perm === 'granted') { ensureSubscribed(); return; }
    // Show prompt only if not dismissed before
    if (!sessionStorage.getItem('push-prompt-dismissed')) setState('prompt');
  }, []);

  async function ensureSubscribed() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) } }),
      });
      setState('done');
    } catch {
      setState('idle');
    }
  }

  async function handleEnable() {
    setState('subscribing');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { await ensureSubscribed(); }
    else { setState('denied'); }
  }

  function handleDismiss() {
    sessionStorage.setItem('push-prompt-dismissed', '1');
    setState('idle');
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl px-4 py-2.5 text-sm font-medium mb-4" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', color: 'oklch(0.35 0.12 145)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
        Push notifications enabled — you'll be alerted when your visitor arrives.
      </div>
    );
  }

  if (state === 'prompt') {
    return (
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-4 flex-wrap" style={{ background: 'oklch(0.38 0.28 265 / 0.06)', border: '1px solid oklch(0.38 0.28 265 / 0.2)' }}>
        <div className="flex-1" style={{ minWidth: 200 }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--afit-navy)' }}>Enable visitor arrival alerts</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Get notified on your device the moment your visitor is let in.</div>
        </div>
        <div className="flex gap-2">
          <button className="h-8 px-3 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--sidebar)' }} onClick={handleEnable}>Enable</button>
          <button className="h-8 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} onClick={handleDismiss}>Not now</button>
        </div>
      </div>
    );
  }

  if (state === 'subscribing') {
    return (
      <div className="rounded-xl px-4 py-2.5 text-sm mb-4" style={{ background: 'oklch(0.38 0.28 265 / 0.06)', color: 'var(--muted-foreground)', border: '1px solid oklch(0.38 0.28 265 / 0.2)' }}>
        Enabling notifications…
      </div>
    );
  }

  return null;
}
