export class ConversionError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  FILE_TYPE_UNSUPPORTED: "FILE_TYPE_UNSUPPORTED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_EMPTY: "FILE_EMPTY",
  TTS_NOT_SUPPORTED: "TTS_NOT_SUPPORTED",
  TTS_FAILED: "TTS_FAILED",
  VIDEO_GENERATION_FAILED: "VIDEO_GENERATION_FAILED",
  CONVERSION_CANCELLED: "CONVERSION_CANCELLED",
} as const;

export function handleConversionError(error: unknown): string {
  if (error instanceof ConversionError) {
    switch (error.code) {
      case ErrorCodes.FILE_TYPE_UNSUPPORTED:
        return "The selected file type is not supported. Please upload a text or PDF file.";
      case ErrorCodes.FILE_TOO_LARGE:
        return "The selected file is too large. Maximum file size is 10MB.";
      case ErrorCodes.FILE_EMPTY:
        return "The selected file is empty. Please upload a file with content.";
      case ErrorCodes.TTS_NOT_SUPPORTED:
        return "Text-to-Speech is not supported in your browser. Please try a different browser.";
      case ErrorCodes.TTS_FAILED:
        return "Failed to convert text to speech. Please try again.";
      case ErrorCodes.VIDEO_GENERATION_FAILED:
        return "Failed to generate video. Please try again.";
      case ErrorCodes.CONVERSION_CANCELLED:
        return "Conversion was cancelled.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export function validateFile(file: File): void {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = ["text/plain", "application/pdf"]; // Support TXT and PDF

  if (!validTypes.includes(file.type)) {
    throw new ConversionError(
      "Unsupported file type: only .txt or .pdf files are supported",
      ErrorCodes.FILE_TYPE_UNSUPPORTED,
      { fileType: file.type }
    );
  }

  if (file.size > maxSize) {
    throw new ConversionError(
      "File too large",
      ErrorCodes.FILE_TOO_LARGE,
      { fileSize: file.size, maxSize }
    );
  }

  if (file.size === 0) {
    throw new ConversionError(
      "Empty file",
      ErrorCodes.FILE_EMPTY
    );
  }
}