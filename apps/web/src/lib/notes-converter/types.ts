export type ConversionOptions = 'audio' | 'video' | 'storybook';

export interface ConvertedContent {
  type: ConversionOptions;
  data: string | Blob;
  metadata?: {
    duration?: number;
    pages?: number;
    mimeType?: string;
  };
}

export interface ConversionError {
  message: string;
  code: string;
  details?: unknown;
}

export interface PDFPageText {
  pageNumber: number;
  text: string;
}

export interface PDFExtractionResult {
  text: string;
  pages: PDFPageText[];
}