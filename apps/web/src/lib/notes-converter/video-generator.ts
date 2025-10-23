import { TTSService } from "./tts";

interface VideoSlide {
  text: string;
  duration: number;
}

export class VideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tts: TTSService;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private slideWidth = 1280;
  private slideHeight = 720;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.slideWidth;
    this.canvas.height = this.slideHeight;
    this.ctx = this.canvas.getContext("2d")!;
    this.tts = new TTSService();
  }

  private async setupMediaRecorder(): Promise<void> {
    const stream = this.canvas.captureStream(30); // 30 FPS
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
  }

  private createSlides(text: string): VideoSlide[] {
    const blocks = text
      .split(/\n\n+/)
      .flatMap((p) => p.split(/\n-\s+|^\s*#/gm))
      .map((b) => b.trim())
      .filter(Boolean);
    return blocks.map((block) => ({
      text: block,
      duration: this.calculateDuration(block),
    }));
  }

  private calculateDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150;
    const ms = (words / wordsPerMinute) * 60 * 1000;
    const clamped = Math.min(Math.max(ms, 2000), 10000);
    return clamped;
  }

  private async renderSlide(slide: VideoSlide): Promise<void> {
    // Clear canvas
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.slideWidth, this.slideHeight);

    // Add a subtle gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.slideHeight);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(1, "#f1f5f9");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.slideWidth, this.slideHeight);

    // Draw text
    this.ctx.fillStyle = "#1e293b";
    this.ctx.font = "32px system-ui";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const lines = this.wrapText(slide.text, this.slideWidth - 100);
    const lineHeight = 40;
    const totalHeight = lines.length * lineHeight;
    const startY = (this.slideHeight - totalHeight) / 2;

    lines.forEach((line, i) => {
      this.ctx.fillText(
        line,
        this.slideWidth / 2,
        startY + i * lineHeight
      );
    });

    // Add a delay matching the audio duration
    await new Promise((resolve) => setTimeout(resolve, slide.duration));
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  public async generateVideo(text: string, onProgress?: (progress: number) => void): Promise<Blob> {
    const slides = this.createSlides(text);
    await this.setupMediaRecorder();

    return new Promise(async (resolve, reject) => {
      try {
        // Start recording
        this.mediaRecorder?.start();

        // Process each slide
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          await this.renderSlide(slide);
          if (onProgress) onProgress((i + 1) / slides.length);
        }

        // Stop recording and create final video
        this.mediaRecorder?.stop();
        this.mediaRecorder!.onstop = () => {
          const videoBlob = new Blob(this.chunks, {
            type: "video/webm",
          });
          this.chunks = [];
          resolve(videoBlob);
        };
      } catch (error) {
        reject(new Error("Failed to generate video: " + error));
      }
    });
  }

  public cancel(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
    this.chunks = [];
  }
}