import { setVapidDetails, sendNotification } from 'web-push';

let configured = false;

function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !sub) return;
  setVapidDetails(sub, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<boolean> {
  configure();
  try {
    await sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: 86400 },
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) return false; // subscription expired
    console.error('Push send error:', err.message);
    return false;
  }
}

export async function sendPushToUser(
  prismaClient: any,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; pruned: number }> {
  const subs = await prismaClient.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let pruned = 0;
  for (const sub of subs) {
    const ok = await sendPush(sub, payload);
    if (ok) { sent++; }
    else {
      await prismaClient.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      pruned++;
    }
  }
  return { sent, pruned };
}
