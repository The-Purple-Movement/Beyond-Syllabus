"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { orpc } from "@/lib/orpc";

export function ShareButton() {
    const [copied, setCopied] = useState(false);
    const [shareLink, setShareLink] = useState("");

    const createShare = async () => {
        try {
            const result = await orpc.share.createShare.call({
                url: window.location.href,
            });

            setShareLink(result.url);
        } catch (err: any) {
            toast.error(err?.message || "Could not create share link");
        }
    };

    const copyToClipboard = async () => {
        try {
            if (!shareLink) return;
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success("Link copied to clipboard");
        } catch (error) {
            toast.error("Could not copy the link");
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" onClick={createShare}>
                    Share
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share this page</DialogTitle>
                    <DialogDescription>
                        Copy the link below to share it with others.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="share-link">Link</Label>
                    <Input id="share-link" readOnly value={shareLink} />
                </div>

                <DialogFooter className="sm:justify-between">
                    <DialogClose asChild>
                        <Button variant="ghost">Close</Button>
                    </DialogClose>

                    <Button onClick={copyToClipboard} disabled={!shareLink}>
                        {copied ? "Copied!" : "Copy Link"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

