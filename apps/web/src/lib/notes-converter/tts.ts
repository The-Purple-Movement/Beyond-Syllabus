export class TTSService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
  private audioBlob: Blob | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();
  }

  private loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoicesHandler = () => {
        this.voices = this.synthesis.getVoices();
        resolve();
      };

      if (this.synthesis.getVoices().length > 0) {
        this.voices = this.synthesis.getVoices();
        resolve();
      } else {
        this.synthesis.addEventListener("voiceschanged", loadVoicesHandler, { once: true });
      }
    });
  }

  private async setupMediaRecorder(): Promise<void> {
    const audioStream = new MediaStream();
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    
    this.mediaRecorder = new MediaRecorder(destination.stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
  }

  public async convertToAudio(text: string): Promise<Blob> {
    await this.loadVoices();
    await this.setupMediaRecorder();

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select a voice (preferably a natural-sounding one)
        const preferredVoice = this.voices.find(
          (voice) => voice.lang === "en-US" && !voice.localService
        );
        utterance.voice = preferredVoice || this.voices[0];
        
        // Configure speech parameters
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Start recording
        this.mediaRecorder?.start();

        // Handle speech completion
        utterance.onend = () => {
          if (this.mediaRecorder?.state === "recording") {
            this.mediaRecorder.stop();
          }
        };

        // Handle recording completion
        this.mediaRecorder!.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/mp3" });
          this.audioChunks = [];
          resolve(audioBlob);
        };

        // Start speaking
        this.synthesis.speak(utterance);
      } catch (error) {
        reject(new Error("Failed to convert text to speech: " + error));
      }
    });
  }

  public cancel(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
  }
}