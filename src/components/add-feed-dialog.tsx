"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseFeed, formatMediumUrl } from "../utils/parser"
import { storage } from "../utils/storage"

interface AddFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFeedAdded: () => void
}

export function AddFeedDialog({ open, onOpenChange, onFeedAdded }: AddFeedDialogProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (username.length !== 0) {
        console.log("username", username)
        const formattedUrl = formatMediumUrl(username)
        const feed = await parseFeed(formattedUrl)
        storage.addFeed(feed)
      } else {
        console.log("url", url)
        const feed = await parseFeed(url)
        storage.addFeed(feed)
      }
      onFeedAdded()
      onOpenChange(false)
      setUrl("")
    } catch (error) {
      console.error("Failed to add feed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Feed</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="https://example.com/feed.xml"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-zinc-900 border-gray-700 text-white"
          />
          <div className="text-center text-gray-400">--- or ---</div>
          <Input placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-zinc-900 border-gray-700 text-white" />
          <Button type="submit" disabled={loading} className="w-full bg-white text-gray-900 hover:bg-gray-100">
            Done
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

