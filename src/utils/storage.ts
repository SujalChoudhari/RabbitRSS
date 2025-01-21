import type { Feed } from "../types/feed"

const FEEDS_KEY = "rabbit-rss-feeds"

export const storage = {
  getFeeds: (): Feed[] => {
    if (typeof window === "undefined") return []
    const feeds = localStorage.getItem(FEEDS_KEY)
    return feeds ? JSON.parse(feeds) : []
  },

  saveFeeds: (feeds: Feed[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
  },

  removeFeed: (feedId: string) => {
    const feeds = storage.getFeeds()
    const updatedFeeds = feeds.filter((feed) => feed.id !== feedId)
    storage.saveFeeds(updatedFeeds)
    return updatedFeeds
  },

  addFeed: (feed: Feed) => {
    const feeds = storage.getFeeds()
    storage.saveFeeds([...feeds, feed])
  },

  markItemAsRead: (feedId: string, itemId: string) => {
    const feeds = storage.getFeeds()
    const updatedFeeds = feeds.map((feed) => {
      if (feed.id === feedId) {
        return {
          ...feed,
          items: feed.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, isRead: true }
            }
            return item
          }),
        }
      }
      return feed
    })
    storage.saveFeeds(updatedFeeds)
    return updatedFeeds
  },
}

