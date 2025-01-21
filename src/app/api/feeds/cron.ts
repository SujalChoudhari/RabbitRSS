// pages/api/cron.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { parseFeed } from '@/utils/parser'
import { storage } from '@/utils/storage'
import webPush from 'web-push'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify this is a legitimate cron job (you might want to add authentication)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Your feed checking logic here
        const currentFeeds = storage.getFeeds()

        for (const feed of currentFeeds) {
            const newFeed = await parseFeed(feed.url)
            const newItems = newFeed.items.filter(newItem =>
                !feed.items.some(existingItem => existingItem.link === newItem.link)
            )

            if (newItems.length > 0 && global.pushSubscription) {
                await webPush.sendNotification(
                    global.pushSubscription,
                    JSON.stringify({
                        title: 'New RSS Updates',
                        feedTitle: feed.title,
                        newItemsCount: newItems.length
                    })
                )
            }
        }

        res.status(200).json({ success: true })
    } catch (error) {
        console.error('Error in cron job:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}