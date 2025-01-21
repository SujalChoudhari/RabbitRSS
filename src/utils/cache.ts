import type { Feed } from "../types/feed"

const CACHE_PREFIX = "rss-cache-"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

export const cache = {
  set: (url: string, data: Feed) => {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(cacheItem))
  },

  get: (url: string): Feed | null => {
    const cached = localStorage.getItem(CACHE_PREFIX + url)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + url)
      return null
    }

    return data
  },

  clear: (url: string) => {
    localStorage.removeItem(CACHE_PREFIX + url)
  },
}

