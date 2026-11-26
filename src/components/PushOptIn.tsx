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
      <div className="notice" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Push notifications enabled — you'll be alerted when your visitor arrives.</span>
      </div>
    );
  }

  if (state === 'prompt') {
    return (
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Enable visitor arrival alerts</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Get notified on your device the moment your visitor is let in.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={handleEnable}>
            Enable
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }} onClick={handleDismiss}>
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (state === 'subscribing') {
    return (
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#475569' }}>
        Enabling notifications…
      </div>
    );
  }

  return null;
}
