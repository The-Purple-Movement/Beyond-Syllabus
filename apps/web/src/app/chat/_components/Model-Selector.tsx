"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Model, ModelSelectorProps } from "@/lib/types";

// Honest labels only: these are open models served by Groq, and saying
// otherwise (the old "GPT 5" label) breaks trust the moment anyone checks.
const models: Model[] = [
  { id: "openai/gpt-oss-120b", name: "Thorough · GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", name: "Balanced · GPT-OSS 20B" },
  { id: "llama-3.1-8b-instant", name: "Fastest · Llama 3.1 8B" },
];


export default function ModelSelector({ onChange }: ModelSelectorProps) {
  const [selected, setSelected] = useState("openai/gpt-oss-120b");
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("selectedModel");
    if (saved && models.find((m) => m.id === saved)) {
      setSelected(saved);
      onChange(saved);
    } else {
      onChange("openai/gpt-oss-120b");
    }
  }, [onChange]);

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem("selectedModel", id);
    onChange(id);
    setIsOpen(false);
  };

  if (!isClient) return null;

  const selectedName = models.find((m) => m.id === selected)?.name || models[0].name;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-56 justify-between bg-transparent hover:text-white ring-1 ring-[#4d4c4c] text-xs"
        >
          <Cpu className="w-4 h-4 text-[#B56DFC]" />
          <span>{selectedName}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#DEDEDF] dark:bg-[#181818] gap-2 px-3 py-4">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSelect(model.id)}
          >
            {model.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
