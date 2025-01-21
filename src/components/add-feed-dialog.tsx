"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseFeed, formatMediumUrl } from "../utils/parser";
import { storage } from "../utils/storage";
// import { Loader } from "@/components/ui/loader"; // Assuming you have a Loader component

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedAdded: () => void;
}

export function AddFeedDialog({ open, onOpenChange, onFeedAdded }: AddFeedDialogProps) {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setUsername("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let feed;
      if (username.trim().length > 0) {
        const formattedUrl = formatMediumUrl(username.trim());
        feed = await parseFeed(formattedUrl);
      } else if (url.trim().length > 0) {
        feed = await parseFeed(url.trim());
      } else {
        throw new Error("Please provide a valid URL or Medium username.");
      }

      storage.addFeed(feed);
      onFeedAdded();
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || "An error occurred while adding the feed.");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || (!url.trim() && !username.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Feed</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <Input
            placeholder="Enter RSS feed URL (e.g., https://example.com/feed.xml)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (username) setUsername("");
            }}
            className="bg-zinc-900 border-gray-700 text-white"
            disabled={loading}
          />
          <div className="text-center text-gray-400">--- or ---</div>
          {/* Username Input */}
          <Input
            placeholder="Enter Medium username (e.g., @username)"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (url) setUrl("");
            }}
            className="bg-zinc-900 border-gray-700 text-white"
            disabled={loading}
          />
          {/* Error Message */}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full ${loading ? "bg-gray-700" : "bg-white text-gray-900 hover:bg-gray-100"}`}
          >
            {loading ? "Loading..." : "Add Feed"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
