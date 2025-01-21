import { type Feed, FeedItem } from "../types/feed"
import { cache } from "./cache"

export async function parseFeed(url: string): Promise<Feed> {
  const cachedFeed = cache.get(url)
  if (cachedFeed) {
    return cachedFeed
  }

  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    if (data.status !== "ok") {
      throw new Error(data.message || "Failed to parse feed")
    }

    console.log("data", data)

    const feed: Feed = {
      id: crypto.randomUUID(),
      title: data.feed.title,
      url: url,
      items: data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        title: item.title,
        description: item.description,
        link: item.link,
        pubDate: item.pubDate,
        thumbnail: item.thumbnail,
        isRead: false,
      })),
    }

    cache.set(url, feed)
    return feed
  } catch (error) {
    console.error("Error parsing feed:", error)
    throw new Error("Failed to parse feed")
  }
}

export function formatMediumUrl(url: string): string {
  if (url.startsWith("@") || !url.includes("://")) {
    const username = url.startsWith("@") ? url.slice(1) : url
    return `https://medium.com/feed/@${username}`
  }
  return url
}

