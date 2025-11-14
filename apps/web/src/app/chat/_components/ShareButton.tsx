import { Button } from "@/components/ui/button";

export function ShareButton() {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    text: "Check this out!",
                    url: window.location.href,
                });
            } catch (err) {
                console.log("Share canceled");
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        }
    };

    return (
        <Button variant="default" onClick={handleShare}>
            Share
        </Button>
    );
}
