"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/notes-converter/upload";
import { ConversionType } from "@/components/notes-converter/conversion-type";
import { Preview } from "@/components/notes-converter/preview";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ConversionOptions } from "@/lib/notes-converter/types";
import { TTSService } from "@/lib/notes-converter/tts";
import { VideoGenerator } from "@/lib/notes-converter/video-generator";
import { StorybookGenerator } from "./storybook";
import { validateFile, handleConversionError } from "@/lib/notes-converter/errors";
import { extractPdfText } from "@/lib/notes-converter/pdf";

export function NotesConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionOptions | null>(null);
  const [convertedContent, setConvertedContent] = useState<string | Blob | string[] | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      validateFile(uploadedFile);
      setFile(uploadedFile);
      setError(null);
      setConvertedContent(null);
    } catch (err) {
      setError(handleConversionError(err));
    }
  };

  const handleConversionTypeChange = (type: ConversionOptions) => {
    setConversionType(type);
    setError(null);
    setConvertedContent(null);
  };

  const handleConvert = async () => {
    if (!file || !conversionType) return;

    setIsConverting(true);
    setError(null);

    try {
      const text = file.type === "application/pdf" ? (await extractPdfText(file)).text : await file.text();

      switch (conversionType) {
        case "audio": {
          const tts = new TTSService();
          const audioBlob = await tts.convertToAudio(text);
          setConvertedContent(audioBlob);
          break;
        }
        case "video": {
          const videoGen = new VideoGenerator();
          const videoBlob = await videoGen.generateVideo(text);
          setConvertedContent(videoBlob);
          break;
        }
        case "storybook": {
          const pages = StorybookGenerator.generatePages(text);
          setConvertedContent(pages);
          break;
        }
      }
    } catch (err) {
      setError(handleConversionError(err));
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Notes Converter</CardTitle>
          <CardDescription>
            Convert your notes into audio podcasts, video lessons, or interactive storybooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onFileUpload={handleFileUpload}
            disabled={isConverting}
          />
          
          {file && (
            <div className="space-y-6">
              <ConversionType
                onTypeSelect={handleConversionTypeChange}
                disabled={isConverting}
              />

              {conversionType && !convertedContent && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="w-full max-w-sm"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      "Convert Notes"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {convertedContent && (
            <Preview
              content={convertedContent}
              type={conversionType!}
              fileName={file?.name || ""}
            />
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}