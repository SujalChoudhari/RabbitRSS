import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseFeed, formatMediumUrl } from "../utils/parser";
import { storage } from "../utils/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Types
interface Feed {
  title: string;
  items: any[];
  [key: string]: any;
}

interface FeedType {
  value: string;
  label: string;
  placeholder: string;
  urlTemplate: (input: string) => string;
}

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedAdded: () => void;
}

// Feed Types Configuration
const feedTypes: FeedType[] = [
  {
    value: "medium",
    label: "Medium",
    placeholder: "Enter Medium username (e.g., @username)",
    urlTemplate: (input: string) => formatMediumUrl(input),
  },
  {
    value: "wordpress",
    label: "WordPress",
    placeholder: "Enter WordPress site URL",
    urlTemplate: (input: string) => `${ensureHttps(input)}/feed`,
  },
  {
    value: "blogger",
    label: "Blogger",
    placeholder: "Enter Blogger URL",
    urlTemplate: (input: string) => `${ensureHttps(input)}/feeds/posts/default`,
  },
  {
    value: "tumblr",
    label: "Tumblr",
    placeholder: "Enter Tumblr username",
    urlTemplate: (input: string) => `https://${input}.tumblr.com/rss`,
  },
  {
    value: "youtube",
    label: "YouTube",
    placeholder: "Enter YouTube channel ID",
    urlTemplate: (input: string) =>
      `https://www.youtube.com/feeds/videos.xml?channel_id=${input}`,
  },
  {
    value: "github",
    label: "GitHub",
    placeholder: "Enter GitHub username/repo",
    urlTemplate: (input: string) => `https://github.com/${input}/releases.atom`,
  },
  {
    value: "reddit",
    label: "Reddit",
    placeholder: "Enter subreddit name",
    urlTemplate: (input: string) => `https://www.reddit.com/r/${input}/.rss`,
  },
  {
    value: "rss",
    label: "Direct RSS/Atom Feed",
    placeholder: "Enter direct feed URL",
    urlTemplate: (input: string) => input,
  },
];

const ensureHttps = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

export function AddFeedDialog({
  open,
  onOpenChange,
  onFeedAdded,
}: AddFeedDialogProps) {
  const [url, setUrl] = useState<string>("");
  const [feedType, setFeedType] = useState<string>("rss");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setFeedType("rss");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const selectedFeedType = feedTypes.find(type => type.value === feedType);
      if (!selectedFeedType) {
        throw new Error("Invalid feed type selected");
      }

      const processedUrl = selectedFeedType.urlTemplate(url.trim());
      const feed = await parseFeed(processedUrl);

      // Type guard for feed validation
      if (!isFeed(feed)) {
        throw new Error("Invalid feed format received");
      }

      if (!feed.title || !feed.items?.length) {
        throw new Error("Invalid feed: No content found");
      }

      await storage.addFeed(feed);
      onFeedAdded();
      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to add feed. Please check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedFeedType = feedTypes.find(type => type.value === feedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border border-zinc-800 shadow-lg max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Add New Feed
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Feed Type</label>
            <Select
              value={feedType}
              onValueChange={(value: string) => setFeedType(value)}
            >
              <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {feedTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="text-white hover:bg-zinc-700"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">
              Feed URL or Username
            </label>
            <Input
              placeholder={selectedFeedType?.placeholder}
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUrl(e.target.value)
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className={`w-full h-10 ${loading
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-white text-zinc-900 hover:bg-zinc-100"
              }`}
          >
            {loading ? "Adding Feed..." : "Add Feed"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Type guard function
function isFeed(feed: any): feed is Feed {
  return (
    typeof feed === 'object' &&
    feed !== null &&
    typeof feed.title === 'string' &&
    Array.isArray(feed.items)
  );
}

export default AddFeedDialog;