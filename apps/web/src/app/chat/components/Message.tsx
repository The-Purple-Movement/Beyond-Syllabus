import { Button } from "@/components/ui/button"
import { Copy, Check, User } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  copied?: boolean;
  onCopy?: () => void;
}

export default function ChatMessage({
  role,
  content,
  copied = false,
  onCopy,
}: ChatMessageProps) {
  const handleCopy = () => {
    if (onCopy) return onCopy();
    navigator.clipboard.writeText(content);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl bg-primary/15 text-foreground rounded-lg px-4 py-3 break-words text-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-sm font-semibold flex-shrink-0">
        <User />
      </div>
      <div className="flex-1 max-w-3xl space-y-3">
        <div className="text-foreground text-sm space-y-2">
          {content.split("\n\n").map((paragraph, idx) => {
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <h3 key={idx} className="font-bold">
                  {paragraph.replace(/\*\*/g, "")}
                </h3>
              );
            }
            if (paragraph.startsWith("•")) {
              return (
                <ul key={idx} className="space-y-1 ml-4">
                  {paragraph.split("\n").map((line, i) => (
                    <li key={i} className="list-disc list-inside">
                      {line.replace("•", "").trim()}
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2 h-8 px-2"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
