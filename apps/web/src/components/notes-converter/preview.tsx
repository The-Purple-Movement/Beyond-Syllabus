"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Play, Pause } from "lucide-react";
import { ConversionOptions } from "@/lib/notes-converter/types";
import { Storybook } from "./storybook";

interface PreviewProps {
  content: string | Blob | string[];
  type: ConversionOptions;
  fileName: string;
}

export function Preview({ content, type, fileName }: PreviewProps) {
  const [url, setUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (content instanceof Blob) {
      const objectUrl = URL.createObjectURL(content);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setUrl("");
    }
  }, [content]);

  useEffect(() => {
    if (type === "audio" && url) {
      const audio = new Audio(url);
      setAudioElement(audio);
      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [type, url]);

  // Audio download removed for now; MediaRecorder capture is not wired

  const togglePlay = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const renderPreview = () => {
    switch (type) {
      case "audio":
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Playback only for now
                </div>
              </div>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="flex flex-col items-center gap-4">
            {url ? (
              <video
                controls
                className="w-full max-w-2xl rounded-lg shadow-lg"
                src={url}
              />
            ) : (
              <div className="text-sm text-muted-foreground">Preparing video preview…</div>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              Generated video is silent for now. You can download it via the player controls.
            </div>
          </div>
        );

      case "storybook":
        if (Array.isArray(content)) {
          return (
            <div className="w-full">
              <Storybook pages={content} />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium">Preview</h3>
      {renderPreview()}
    </div>
  );
}