// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import webPush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const email = process.env.VAPID_EMAIL!;

webPush.setVapidDetails(
  `mailto:${email}`,
  publicKey,
  privateKey
);

export async function POST(req: Request) {
  try {
    const subscription = await req.json();

    // Store this subscription in your database
    // For now, we'll just save it in memory
    // In a real app, you'd save this to a database
    global.pushSubscription = subscription;

    return NextResponse.json({ message: 'Subscription saved' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error saving subscription' },
      { status: 500 }
    );
  }
}