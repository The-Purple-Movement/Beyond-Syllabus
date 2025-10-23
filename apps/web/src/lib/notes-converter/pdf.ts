import type { PDFExtractionResult, PDFPageText } from "./types";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

async function ensurePdfJsLoaded(): Promise<any> {
  if (typeof window === "undefined") throw new Error("PDF extraction can only run in the browser");
  if (window.pdfjsLib) return window.pdfjsLib;

  const version = "3.11.174";
  const libUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.min.js`;
  const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = libUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load pdf.js library"));
    document.head.appendChild(script);
  });

  if (!window.pdfjsLib) throw new Error("pdf.js library not available on window");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return window.pdfjsLib;
}

export async function extractPdfText(file: File): Promise<PDFExtractionResult> {
  const pdfjs = await ensurePdfJsLoaded();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer as ArrayBuffer });
  const pdf = await loadingTask.promise;

  const pages: PDFPageText[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => ("str" in item ? item.str : ""));
    const text = strings.join(" ").replace(/\s+/g, " ").trim();
    pages.push({ pageNumber: pageNum, text });
  }

  return {
    text: pages.map((p) => p.text).join("\n\n"),
    pages,
  };
}


