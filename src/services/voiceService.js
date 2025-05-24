class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;

    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-GB"; // British English for London properties
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStartCallback) this.onStartCallback();
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && this.onResultCallback) {
          this.onResultCallback(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.isListening = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) this.onEndCallback();
      };
    } else {
      console.warn("Speech recognition not supported");
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        return true;
      } catch (error) {
        console.error("Failed to start recognition:", error);
        return false;
      }
    }
    return false;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text, options = {}) {
    if (this.synthesis) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Try to use a British English voice
      const voices = this.synthesis.getVoices();
      const britishVoice = voices.find(
        (voice) =>
          voice.lang.includes("en-GB") || voice.name.includes("British")
      );

      if (britishVoice) {
        utterance.voice = britishVoice;
      }

      // Set up callbacks
      if (options.onStart) utterance.onstart = options.onStart;
      if (options.onEnd) utterance.onend = options.onEnd;
      if (options.onError) utterance.onerror = options.onError;

      this.synthesis.speak(utterance);
      return utterance;
    }
    return null;
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSpeaking() {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  // Event handlers
  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  // Check if speech recognition is supported
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Get available voices
  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}

export default new VoiceService();
