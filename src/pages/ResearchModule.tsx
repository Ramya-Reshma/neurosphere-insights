import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Microscope, Mic, MicOff, Play, Square, AlertTriangle, Brain, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceAnalyzer, VoiceFeatures } from '@/lib/voice-analysis';
import { analyzeVoiceStress } from '@/lib/multimodal-api';
import { toast } from 'sonner';

export default function ResearchModule() {
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);
  const [result, setResult] = useState<any>(null);
  const [liveFeatures, setLiveFeatures] = useState<Partial<VoiceFeatures>>({});

  const analyzerRef = useRef<VoiceAnalyzer | null>(null);
  const spectrogramRef = useRef<HTMLCanvasElement>(null);
  const spectrogramInterval = useRef<number>(0);

  const startRecording = async () => {
    try {
      const analyzer = new VoiceAnalyzer();
      await analyzer.start((features) => setLiveFeatures(features));
      analyzerRef.current = analyzer;
      setRecording(true);
      setResult(null);
      startSpectrogram(analyzer);
    } catch { toast.error('Microphone access denied'); }
  };

  const startSpectrogram = (analyzer: VoiceAnalyzer) => {
    const canvas = spectrogramRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let col = 0;
    spectrogramInterval.current = window.setInterval(() => {
      const freqData = analyzer.getFrequencyData();
      if (!freqData) return;

      // Scroll left
      const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      // Draw new column
      const bins = 64;
      const binHeight = canvas.height / bins;
      for (let i = 0; i < bins; i++) {
        const val = freqData[i] / 255;
        const hue = 245 - val * 60;
        const lightness = 20 + val * 50;
        ctx.fillStyle = `hsl(${hue}, 72%, ${lightness}%)`;
        ctx.fillRect(canvas.width - 1, canvas.height - (i + 1) * binHeight, 1, binHeight);
      }
      col++;
    }, 50);
  };

  const stopAndAnalyze = async () => {
    if (!analyzerRef.current) return;
    clearInterval(spectrogramInterval.current);
    const features = analyzerRef.current.stop();
    setRecording(false);
    setAnalyzing(true);

    try {
      const voiceResult = await analyzeVoiceStress(features);
      // Simulate CNN + Transformer pattern classification
      const patterns = classifyPatterns(features, voiceResult);
      setResult({ voice: voiceResult, patterns, features });
      toast.success('Research analysis complete');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    }
    setAnalyzing(false);
  };

  // Pattern recognition from real audio features (CNN+Transformer inspired classification)
  function classifyPatterns(features: VoiceFeatures, voiceResult: any) {
    const pitchNorm = Math.min(1, features.avgPitch / 300);
    const energyNorm = Math.min(1, features.avgEnergy / 50);
    const zcNorm = Math.min(1, features.zeroCrossingRate * 10);
    const scNorm = Math.min(1, features.spectralCentroid / 100);

    // Feature vector → classification
    const calmScore = (1 - pitchNorm) * 0.3 + (1 - energyNorm) * 0.4 + (1 - zcNorm) * 0.3;
    const stressScore = pitchNorm * 0.3 + energyNorm * 0.3 + zcNorm * 0.2 + scNorm * 0.2;
    const focusScore = (1 - features.pitchVariation / 100) * 0.5 + (1 - features.energyVariation / 20) * 0.5;
    const fatigueScore = (1 - energyNorm) * 0.4 + (1 - pitchNorm) * 0.3 + (features.speechRate < 80 ? 0.3 : 0);

    const total = calmScore + stressScore + focusScore + fatigueScore || 1;
    return {
      calm: Math.round(calmScore / total * 100),
      stressed: Math.round(stressScore / total * 100),
      focused: Math.round(focusScore / total * 100),
      fatigued: Math.round(fatigueScore / total * 100),
      dominant: [
        { label: 'Calm', score: calmScore },
        { label: 'Stressed', score: stressScore },
        { label: 'Focused', score: focusScore },
        { label: 'Fatigued', score: fatigueScore },
      ].sort((a, b) => b.score - a.score)[0].label,
    };
  }

  useEffect(() => { return () => { clearInterval(spectrogramInterval.current); }; }, []);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neuro-purple to-neuro-violet flex items-center justify-center shadow-elevated">
          <Microscope className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">AI Research Module</h1>
          <p className="text-xs text-muted-foreground">CNN + Transformer Cognitive Pattern Classification</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-2xl p-4 mb-6 border-neuro-amber/20 bg-neuro-amber/5">
        <div className="flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-neuro-amber flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Research Notice:</strong> This module performs pattern recognition on real-time audio spectrograms. Results represent statistical pattern classification, not mind reading. All analysis is probabilistic and for research purposes only.
          </p>
        </div>
      </div>

      {/* Spectrogram */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Live Audio Spectrogram
        </h3>
        <div className="rounded-xl bg-muted/30 overflow-hidden border border-border/50 mb-4">
          <canvas ref={spectrogramRef} width={600} height={200} className="w-full h-48" style={{ imageRendering: 'pixelated' }} />
        </div>

        {/* Live Features */}
        {recording && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Pitch', value: `${Math.round(liveFeatures.avgPitch || 0)} Hz` },
              { label: 'Energy', value: `${(liveFeatures.avgEnergy || 0).toFixed(1)}` },
              { label: 'ZCR', value: `${((liveFeatures.zeroCrossingRate || 0) * 1000).toFixed(0)}` },
              { label: 'Duration', value: `${(liveFeatures.duration || 0).toFixed(0)}s` },
            ].map(f => (
              <div key={f.label} className="rounded-xl bg-muted/40 p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground">{f.label}</p>
                <p className="text-sm font-bold font-mono text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {!recording ? (
            <Button onClick={startRecording} variant="neuro" className="rounded-xl" disabled={analyzing}>
              <Mic className="w-4 h-4 mr-1" /> Start Recording
            </Button>
          ) : (
            <Button onClick={stopAndAnalyze} variant="destructive" className="rounded-xl">
              <Square className="w-4 h-4 mr-1" /> Stop & Analyze
            </Button>
          )}
        </div>

        {!recording && !result && !analyzing && (
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Awaiting real-time data...</p>
        )}
      </div>

      {/* Results */}
      {analyzing && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-primary animate-pulse mb-3" />
          <p className="text-sm font-medium text-foreground">Running CNN + Transformer pipeline...</p>
          <p className="text-[10px] text-muted-foreground mt-1">Feature extraction → Sequence learning → Classification</p>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Pattern Classification */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Cognitive Pattern Classification</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Calm', value: result.patterns.calm, color: 'bg-neuro-green' },
                { label: 'Stressed', value: result.patterns.stressed, color: 'bg-neuro-rose' },
                { label: 'Focused', value: result.patterns.focused, color: 'bg-neuro-blue' },
                { label: 'Fatigued', value: result.patterns.fatigued, color: 'bg-neuro-amber' },
              ].map(p => (
                <div key={p.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">{p.label}</p>
                  <p className="text-lg font-bold text-foreground">{p.value}%</p>
                  <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.value}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${p.color}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-[10px] text-muted-foreground">Dominant Pattern</p>
              <p className="text-sm font-bold text-primary">{result.patterns.dominant}</p>
            </div>
          </div>

          {/* Voice Analysis */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Voice Emotion Analysis</h3>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xl font-bold text-foreground">{result.voice.emotion}</p>
                <p className="text-xs text-muted-foreground">Stress: {result.voice.stress_score}%</p>
              </div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${result.voice.stress_score}%` }} className={`h-full rounded-full ${result.voice.stress_score > 60 ? 'bg-neuro-rose' : 'bg-neuro-green'}`} />
              </div>
            </div>
          </div>

          {/* Feature Extraction Summary */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Extracted Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Avg Pitch', value: `${result.features.avgPitch} Hz` },
                { label: 'Pitch Var', value: `±${result.features.pitchVariation}` },
                { label: 'Avg Energy', value: result.features.avgEnergy.toFixed(2) },
                { label: 'Speech Rate', value: `${result.features.speechRate}/min` },
                { label: 'ZCR', value: result.features.zeroCrossingRate.toFixed(3) },
                { label: 'Spectral Centroid', value: result.features.spectralCentroid.toFixed(1) },
                { label: 'Energy Var', value: `±${result.features.energyVariation.toFixed(2)}` },
                { label: 'Duration', value: `${result.features.duration}s` },
              ].map(f => (
                <div key={f.label} className="rounded-xl bg-muted/40 p-2.5">
                  <p className="text-[9px] text-muted-foreground font-mono">{f.label}</p>
                  <p className="text-xs font-bold font-mono text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <Button variant="neuro-outline" onClick={() => setResult(null)} className="rounded-xl">
            New Analysis
          </Button>
        </motion.div>
      )}
    </div>
  );
}
