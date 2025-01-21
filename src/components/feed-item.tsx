import React from "react"
import type { FeedItem as FeedItemType } from "../types/feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { formatDistanceToNow } from 'date-fns';

const cleanHtml = (html: string) => html.replace(/<\/?[^>]+(>|$)/g, "")

interface FeedItemProps {
  item: FeedItemType
  onClick: () => void
}

export const FeedItem = React.memo(({ item, onClick }: FeedItemProps) => {
  return (
    <Card className="bg-zinc-900 mx-6 border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors" onClick={onClick}>
      <CardHeader className="p-4">
        <CardTitle className="text-white text-base">
          {cleanHtml(item.title).slice(0, window.innerWidth < 768 ? 50 : undefined)}
        </CardTitle>
        <time className="text-zinc-400 text-sm">{formatDistanceToNow(new Date(item.pubDate).toLocaleString())}</time>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {item.thumbnail && (
          <div className="mb-2">
            <img
              src={item.thumbnail || "/placeholder.svg"}
              alt={cleanHtml(item.title)}
              width={200}
              height={112}
              className="rounded-md object-cover"
            />
          </div>
        )}
        <p className="text-zinc-400 text-sm line-clamp-2">
          {cleanHtml(item.description).slice(0, window.innerWidth < 768 ? 100 : undefined)}
        </p>
      </CardContent>
    </Card>
  )
})

FeedItem.displayName = "FeedItem"

