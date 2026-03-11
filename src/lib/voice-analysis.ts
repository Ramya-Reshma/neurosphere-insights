// Real-time voice feature extraction using Web Audio API

export interface VoiceFeatures {
  avgPitch: number;
  pitchVariation: number;
  avgEnergy: number;
  energyVariation: number;
  speechRate: number; // estimated from energy peaks
  zeroCrossingRate: number;
  spectralCentroid: number;
  duration: number;
}

export class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private pitchSamples: number[] = [];
  private energySamples: number[] = [];
  private zcSamples: number[] = [];
  private spectralSamples: number[] = [];
  private startTime: number = 0;
  private animationFrame: number = 0;
  private onUpdate?: (features: Partial<VoiceFeatures>) => void;

  async start(onUpdate?: (features: Partial<VoiceFeatures>) => void): Promise<void> {
    this.onUpdate = onUpdate;
    this.pitchSamples = [];
    this.energySamples = [];
    this.zcSamples = [];
    this.spectralSamples = [];

    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.source.connect(this.analyser);
    this.startTime = Date.now();
    this.processAudio();
  }

  private processAudio() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    const freqArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getFloatTimeDomainData(dataArray);
    this.analyser.getByteFrequencyData(freqArray);

    // Energy (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    this.energySamples.push(rms);

    // Zero Crossing Rate
    let zcr = 0;
    for (let i = 1; i < bufferLength; i++) {
      if ((dataArray[i] >= 0 && dataArray[i - 1] < 0) || (dataArray[i] < 0 && dataArray[i - 1] >= 0)) {
        zcr++;
      }
    }
    this.zcSamples.push(zcr / bufferLength);

    // Spectral Centroid
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < freqArray.length; i++) {
      numerator += i * freqArray[i];
      denominator += freqArray[i];
    }
    const sc = denominator > 0 ? numerator / denominator : 0;
    this.spectralSamples.push(sc);

    // Pitch estimation (autocorrelation)
    const pitch = this.estimatePitch(dataArray, this.audioContext!.sampleRate);
    if (pitch > 50 && pitch < 500) {
      this.pitchSamples.push(pitch);
    }

    // Send live update
    if (this.onUpdate && this.energySamples.length % 5 === 0) {
      this.onUpdate({
        avgPitch: this.pitchSamples.length > 0 ? avg(this.pitchSamples) : 0,
        avgEnergy: avg(this.energySamples) * 100,
        zeroCrossingRate: avg(this.zcSamples),
        spectralCentroid: avg(this.spectralSamples),
        duration: (Date.now() - this.startTime) / 1000,
      });
    }

    this.animationFrame = requestAnimationFrame(() => this.processAudio());
  }

  private estimatePitch(buffer: Float32Array, sampleRate: number): number {
    // Autocorrelation pitch detection
    const size = buffer.length;
    const threshold = 0.2;

    let rms = 0;
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return 0;

    let r1 = 0, r2 = size - 1;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < threshold) { r2 = size - i; break; }
    }

    const trimmed = buffer.slice(r1, r2);
    const trimSize = trimmed.length;
    const c = new Float32Array(trimSize);

    for (let i = 0; i < trimSize; i++) {
      for (let j = 0; j < trimSize - i; j++) {
        c[i] += trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1] && d < trimSize - 1) d++;

    let maxVal = -1;
    let maxPos = -1;
    for (let i = d; i < trimSize; i++) {
      if (c[i] > maxVal) {
        maxVal = c[i];
        maxPos = i;
      }
    }

    return maxPos > 0 ? sampleRate / maxPos : 0;
  }

  stop(): VoiceFeatures {
    cancelAnimationFrame(this.animationFrame);
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();

    const duration = (Date.now() - this.startTime) / 1000;

    // Count energy peaks as proxy for speech rate
    let peakCount = 0;
    const threshold = avg(this.energySamples) * 1.3;
    let wasBelowThreshold = true;
    for (const e of this.energySamples) {
      if (e > threshold && wasBelowThreshold) {
        peakCount++;
        wasBelowThreshold = false;
      } else if (e < threshold) {
        wasBelowThreshold = true;
      }
    }

    const features: VoiceFeatures = {
      avgPitch: this.pitchSamples.length > 0 ? Math.round(avg(this.pitchSamples)) : 0,
      pitchVariation: this.pitchSamples.length > 1 ? Math.round(stdDev(this.pitchSamples)) : 0,
      avgEnergy: Math.round(avg(this.energySamples) * 10000) / 100,
      energyVariation: Math.round(stdDev(this.energySamples) * 10000) / 100,
      speechRate: duration > 0 ? Math.round(peakCount / duration * 60) : 0,
      zeroCrossingRate: Math.round(avg(this.zcSamples) * 1000) / 1000,
      spectralCentroid: Math.round(avg(this.spectralSamples) * 10) / 10,
      duration: Math.round(duration * 10) / 10,
    };

    this.analyser = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;

    return features;
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}
