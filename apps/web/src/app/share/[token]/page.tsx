"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { toast } from "react-hot-toast";
import ErrorDisplay from "@/components/ErrorDisplay";
import Loader from "@/components/Loader";

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
    if (error) return <ErrorDisplay errorMessage={error} />;
    return null;
}
