"use client";

import { useCallback, useState } from "react";
import { Upload, File as FileIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileUpload, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
  }, [disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileUpload(file);
      }
    },
    [onFileUpload, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        setSelectedFile(file);
        onFileUpload(file);
      }
    },
    [onFileUpload, disabled]
  );

  const isValidFile = (file: File): boolean => {
    const validTypes = ["text/plain"]; // TXT only for now
    return validTypes.includes(file.type);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="flex items-center justify-center gap-2">
          <FileIcon className="w-6 h-6" />
          <span>{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
            }}
            disabled={disabled}
          >
            Change
          </Button>
        </div>
      ) : (
        <>
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop your notes file here, or click to select
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports TXT and PDF files
          </p>
          <Input
            type="file"
            accept=".txt,.pdf,application/pdf"
            className="hidden"
            id="file-upload"
            onChange={handleFileInput}
            disabled={disabled}
          />
          <Button asChild disabled={disabled}>
            <label htmlFor="file-upload" className={`cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
              Select File
            </label>
          </Button>
        </>
      )}
    </div>
  );
}