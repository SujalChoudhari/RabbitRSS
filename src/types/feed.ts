export interface FeedItem {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  thumbnail?: string
  isRead: boolean
}

export interface Feed {
  id: string
  title: string
  url: string
  image?: string
  items: FeedItem[]
}

