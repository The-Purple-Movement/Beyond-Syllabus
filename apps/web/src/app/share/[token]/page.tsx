"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
import ErrorDisplay from "@/components/ErrorDisplay";

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
            <div className="flex items-center justify-center h-screen">
                <Spinner className="w-12 h-12 text-[#B56DFC]" />
                <span className="ml-4 text-lg font-medium">Redirecting...</span>
            </div>
        );
    }
    if (error) return <ErrorDisplay errorMessage={error} />;
    return null;
}
