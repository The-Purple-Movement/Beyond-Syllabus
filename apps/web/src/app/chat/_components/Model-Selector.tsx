"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Model, ModelSelectorProps } from "@/types";

const models: Model[] = [
  { id: "openai/gpt-oss-120b", name: "GPT 5" },
  { id: "openai/gpt-oss-20b", name: "GPT 4.1" },
  { id: "llama-3.1-8b-instant", name: "LLama 3" },
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

  const selectedName = models.find((m) => m.id === selected)?.name || "GPT 5";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-36 justify-between hover:text-white bg-[#D9D9D9] ring-2 ring-[#B56DFC]"
        >
          <span>{selectedName}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36 bg-[#D9D9D9] dark:bg-[#181818]">
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
