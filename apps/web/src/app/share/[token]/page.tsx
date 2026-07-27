"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { orpc } from "@/lib/orpc";
import { toast } from "react-hot-toast";
import Loader from "@/components/Loader";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Hourglass } from "lucide-react";

export default function ShareRedirectPage() {
    const params = useParams();
    const tokenParam = params?.token;
    const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!token || !token.trim()) {
            const msg = "Invalid share link";
            setError(msg);
            toast.error(msg);
            setLoading(false);
            return;
        }
        const fetchShare = async () => {
            try {
                const { url } = await orpc.share.getShare.call({ token });
                window.location.href = url;
            } catch (err: any) {
                const msg = err?.message || "Share link expired or not found";
                setError(msg);
                toast.error(msg);
                setLoading(false);
            }
        };
        fetchShare();
    }, [token]);

    if (loading) {
        return (
            <Loader />
        );
    }
    // An expired share is a normal outcome (links live 7 days), not an
    // application failure: no red error wall, no pointless Retry.
    if (error)
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4 mt-20">
                    <div className="text-center space-y-4 max-w-md">
                        <Hourglass className="h-10 w-10 mx-auto text-primary" />
                        <h1 className="text-2xl font-bold">
                            This share link has expired
                        </h1>
                        <p className="text-muted-foreground">
                            Shared conversations live for 7 days. Ask whoever
                            sent it to share again, or start your own session.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <Button asChild>
                                <Link href="/select">Find your syllabus</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/">Home</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    return null;
}
