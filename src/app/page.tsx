"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddFeedDialog } from "@/components/add-feed-dialog"
import { FeedItem } from "@/components/feed-item"
import { storage } from "@/utils/storage"
import type { Feed, FeedItem as FeedItemType } from "@/types/feed"
import { Bell, BellDot, ChevronLeft, MoveLeft, PlusIcon } from "lucide-react"
import { parseFeed } from "@/utils/parser"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from 'date-fns';


export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { toast } = useToast()

  // Register service worker and set up notifications
  useEffect(() => {
    async function setupNotifications() {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        try {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('Service Worker registered')

          // Check if notifications are already enabled
          const permission = await Notification.permission
          setNotificationsEnabled(permission === 'granted')

          // Set up periodic feed checking (every 2 hours)
          setInterval(async () => {
            await fetch('/api/feeds/check')
          }, 2 * 60 * 60 * 1000)
        } catch (error) {
          console.error('Error setting up notifications:', error)
        }
      }
    }

    setupNotifications()
  }, [])

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")

      if (permission === "granted") {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })

        // Send subscription to backend
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        })

        toast({
          title: "Notifications enabled",
          description: "You'll receive notifications even when the site is closed."
        })
      }
    } catch (error) {
      console.error("Error enabling notifications:", error)
      toast({
        title: "Error enabling notifications",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }


  const showNotification = useCallback((feedTitle: string, newItemsCount: number) => {
    if (!notificationsEnabled || !('Notification' in window)) return

    try {
      new Notification('New RSS Updates', {
        body: `${feedTitle} has ${newItemsCount} new ${newItemsCount === 1 ? 'article' : 'articles'}`,
        icon: '/favicon.ico'
      })
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }, [notificationsEnabled])

  const refreshFeeds = useCallback(async () => {
    try {
      const currentFeeds = storage.getFeeds()
      const refreshedFeeds = await Promise.all(
        currentFeeds.map(async (feed) => {
          try {
            const newFeed = await parseFeed(feed.url)
            let newItemsCount = 0

            const updatedItems = newFeed.items.map((newItem) => {
              const existingItem = feed.items.find((item) => item.link === newItem.link)
              if (!existingItem) {
                newItemsCount++
                return { ...newItem, isRead: false }
              }
              return { ...newItem, isRead: existingItem.isRead }
            })

            if (newItemsCount > 0 && notificationsEnabled) {
              showNotification(feed.title, newItemsCount)
            }

            return { ...newFeed, items: updatedItems }
          } catch (error) {
            console.error(`Failed to refresh feed: ${feed.url}`, error)
            return feed
          }
        })
      )

      storage.saveFeeds(refreshedFeeds)
      setFeeds(refreshedFeeds)

      if (selectedFeed) {
        setSelectedFeed(refreshedFeeds.find((f) => f.id === selectedFeed.id) || null)
      }
    } catch (error) {
      console.error('Error refreshing feeds:', error)
    }
  }, [selectedFeed, notificationsEnabled, showNotification])

  useEffect(() => {
    setFeeds(storage.getFeeds())

    // Check if notifications are already enabled
    setNotificationsEnabled(Notification.permission === "granted")

    // Initial refresh
    // refreshFeeds()

    // Set up refresh interval (2 hours)
    // const intervalId = setInterval(refreshFeeds, 2 * 60 * 60 * 1000)

    // Clean up interval on unmount
    // return () => clearInterval(intervalId)
  }, [refreshFeeds])

  const handleFeedAdded = useCallback(() => {
    setFeeds(storage.getFeeds())
  }, [])

  const handleItemClick = useCallback(
    (item: FeedItemType) => {
      if (selectedFeed) {
        const updatedFeeds = storage.markItemAsRead(selectedFeed.id, item.id)
        setFeeds(updatedFeeds)
        const updatedFeed = updatedFeeds.find((f) => f.id === selectedFeed.id)
        if (updatedFeed) {
          setSelectedFeed(updatedFeed)
        }
      }
      window.open(item.link, "_blank")
    },
    [selectedFeed],
  )

  const { unreadItems, readItems } = useMemo(() => {
    const unread = selectedFeed?.items.filter((item) => !item.isRead) || []
    const read = selectedFeed?.items.filter((item) => item.isRead) || []
    return { unreadItems: unread, readItems: read }
  }, [selectedFeed])

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: unreadItems.length + readItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-zinc-800 feed-list">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h1 className="text-lg font-medium text-white">🐇 Rabbit RSS</h1>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <Button
                onClick={requestNotificationPermission}
                variant="ghost"
                size="icon"
                className="text-white"
                title="Enable notifications"
              >
                <BellDot className="h-5 w-5" />
              </Button>
            )}
            <Button
              onClick={() => setDialogOpen(true)}
              variant="ghost"
              size="icon"
              className="text-white"
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="py-4 mx-2 space-y-4">
            {/* Feeds with unread items */}
            {feeds
              .filter((feed) => feed.items.some((item) => !item.isRead)) // Only feeds with unread items
              .sort(
                (a, b) =>
                  new Date(b.items[0]?.pubDate || 0).getTime() -
                  new Date(a.items[0]?.pubDate || 0).getTime()
              )
              .map((feed) => {
                const unreadCount = feed.items.filter((item) => !item.isRead).length;
                return (
                  <div
                    key={feed.id}
                    className={`p-4 rounded-lg cursor-pointer ${selectedFeed?.id === feed.id ? "bg-zinc-900" : "hover:bg-zinc-900"
                      } ${unreadCount > 0 ? "ring-1 ring-white/20" : ""}`}
                    onClick={() => {
                      setSelectedFeed(feed);
                      // On mobile, hide the feed list when a feed is selected
                      if (window.innerWidth < 768) {
                        document.querySelector(".feed-list")?.classList.add("hidden");
                        document.querySelector(".feed-content")?.classList.remove("hidden");
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold">{feed.title}</h3>
                        <p className="text-zinc-400 text-sm truncate">
                          {feed.url.startsWith("https://medium.com/")
                            ? "@" + feed.url.split("@")[1]
                            : feed.url}
                        </p>
                        <p className="text-zinc-400 text-sm">
                        {formatDistanceToNow(new Date(feed.items[0]?.pubDate || 0), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium leading-none text-black transform bg-white rounded-full">
                        <Bell size={16} className="mr-2" />{unreadCount}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Feeds with no unread items */}
            {feeds
              .filter((feed) => feed.items.every((item) => item.isRead)) // Only feeds with no unread items
              .sort(
                (a, b) =>
                  new Date(b.items[0]?.pubDate || 0).getTime() -
                  new Date(a.items[0]?.pubDate || 0).getTime()
              )
              .map((feed) => (
                <div
                  key={feed.id}
                  className={`p-4 rounded-lg cursor-pointer ${selectedFeed?.id === feed.id ? "bg-zinc-900" : "hover:bg-zinc-900"
                    }`}
                  onClick={() => {
                    setSelectedFeed(feed);
                    // On mobile, hide the feed list when a feed is selected
                    if (window.innerWidth < 768) {
                      document.querySelector(".feed-list")?.classList.add("hidden");
                      document.querySelector(".feed-content")?.classList.remove("hidden");
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white">{feed.title}</h3>
                      <p className="text-zinc-400 text-sm truncate">
                        {feed.url.startsWith("https://medium.com/")
                          ? "@" + feed.url.split("@")[1]
                          : feed.url}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {/* Another Add Feed Button */}
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            size="sm"
            className="mx-auto flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Add New RSS Feed</span>
          </Button>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="w-full md:flex flex-col flex-1 feed-content hidden">
        {selectedFeed ? (
          <div className="flex-1">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <Button
                variant="ghost"
                className="md:hidden mr-2 text-white"
                onClick={() => {
                  document.querySelector(".feed-list")?.classList.remove("hidden")
                  document.querySelector(".feed-content")?.classList.add("hidden")
                }}
              >
                <ChevronLeft />
              </Button>
              <h2 className="text-xl font-bold text-white">{selectedFeed.title}</h2>
              <Button
                variant="default"
                className="text-white"
                onClick={() => {
                  storage.removeFeed(selectedFeed.id)
                  setFeeds(storage.getFeeds())
                }}
              >
                Unsubscribe
              </Button>

            </div>
            <ScrollArea className="h-[calc(100vh-5rem)]" ref={parentRef}>
              <div className="space-y-4 mt-4">
                {/* Unread Items */}
                {unreadItems.length > 0 && (
                  <>
                    <p className="mx-6 text-sm text-zinc-400">Unread</p>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      if (virtualRow.index >= unreadItems.length) return null; // Skip read items here

                      const item = unreadItems[virtualRow.index];
                      return (
                        <div key={item.id}>
                          <FeedItem item={item} onClick={() => handleItemClick(item)} />
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Read Items */}
                {readItems.length > 0 && (
                  <>
                    <p className="mx-6 mt-8 text-sm text-zinc-400">Read</p>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      if (virtualRow.index < unreadItems.length) return null; // Skip unread items here

                      const item = readItems[virtualRow.index - unreadItems.length];
                      return (
                        <div key={item.id}>
                          <FeedItem item={item} onClick={() => handleItemClick(item)} />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            Select a feed to view its contents
          </div>
        )}
      </div>

      <AddFeedDialog open={dialogOpen} onOpenChange={setDialogOpen} onFeedAdded={handleFeedAdded} />
    </div>
  )
}

