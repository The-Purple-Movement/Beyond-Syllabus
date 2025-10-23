"use client";

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { ConversionOptions } from "@/lib/notes-converter/types";
import { Headphones, Video, Book } from "lucide-react";

interface ConversionTypeProps {
  onTypeSelect: (type: ConversionOptions) => void;
  disabled?: boolean;
}

const conversionOptions = [
  {
    id: "audio",
    label: "Audio Podcast",
    description: "Convert notes to spoken audio using Text-to-Speech",
    icon: Headphones,
  },
  {
    id: "video",
    label: "Video Lesson",
    description: "Create a video with slides and narration",
    icon: Video,
  },
  {
    id: "storybook",
    label: "Interactive Storybook",
    description: "Generate an interactive page-by-page storybook",
    icon: Book,
  },
] as const;

export function ConversionType({ onTypeSelect, disabled }: ConversionTypeProps) {
  return (
    <RadioGroup
      onValueChange={(value) => onTypeSelect(value as ConversionOptions)}
      className="grid gap-4 md:grid-cols-3"
      disabled={disabled}
    >
      {conversionOptions.map((option) => (
        <div key={option.id}>
          <RadioGroupItem
            value={option.id}
            id={option.id}
            className="peer sr-only"
          />
          <Label
            htmlFor={option.id}
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <option.icon className="mb-3 h-6 w-6" />
            <h3 className="font-medium">{option.label}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {option.description}
            </p>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}