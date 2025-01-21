"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { Button } from "@/components/ui/button";
import { parseFeed } from "../utils/parser";
import { storage } from "../utils/storage";

interface ImportFeedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFeedAdded: () => void;
}

export function ImportFeedDialog({ open, onOpenChange, onFeedAdded }: ImportFeedDialogProps) {
    const [urls, setUrls] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setUrls("");
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const urlArray = urls.split('\n').map(url => url.trim()).filter(url => url); // Split and trim URLs

        try {
            const feeds = await Promise.all(urlArray.map(url => parseFeed(url))); // Parse each URL

            // Get existing feeds from storage
            const existingFeeds = storage.getFeeds().map(feed => feed.url); // Assuming storage.getFeeds() returns an array of feed objects with a url property

            // Filter out duplicates
            const newFeeds = feeds.filter(feed => !existingFeeds.includes(feed.url));

            // Add each new feed to storage
            newFeeds.forEach(feed => storage.addFeed(feed));

            if (newFeeds.length > 0) {
                onFeedAdded(); // Call this only if new feeds were added
            } else {
                setError("No new feeds were added. All feeds were duplicates.");
            }

            onOpenChange(false);
        } catch (error: any) {
            setError(error.message || "An error occurred while importing feeds.");
        } finally {
            setLoading(false);
        }
    };


    const isSubmitDisabled = loading || !urls.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Import Feeds</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Textarea for URLs */}
                    <Textarea
                        placeholder="Paste RSS feed URLs here, one per line"
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
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
                        {loading ? "Loading..." : "Import Feeds"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
