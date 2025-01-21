// app/api/feeds/check/route.ts
import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { parseFeed } from '@/utils/parser';
import { storage } from '@/utils/storage';

export async function GET() {
    try {
        const currentFeeds = storage.getFeeds();

        for (const feed of currentFeeds) {
            const newFeed = await parseFeed(feed.url);
            const newItems = newFeed.items.filter(newItem =>
                !feed.items.some(existingItem => existingItem.link === newItem.link)
            );

            if (newItems.length > 0 && global.pushSubscription) {
                await webPush.sendNotification(
                    global.pushSubscription,
                    JSON.stringify({
                        title: 'New RSS Updates',
                        feedTitle: feed.title,
                        newItemsCount: newItems.length
                    })
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Error checking feeds' },
            { status: 500 }
        );
    }
}