import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Smile, Camera, Mic, MicOff, VideoOff, AlertCircle } from 'lucide-react';

interface EmotionResult {
  facial: string;
  facialConfidence: number;
  voice: string;
  voiceConfidence: number;
}

const emotions = ['Happy', 'Sad', 'Neutral', 'Angry', 'Surprised', 'Calm'];
const voiceEmotions = ['Happy', 'Sad', 'Neutral', 'Stressed', 'Calm'];

export default function EmotionModule() {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraActive(true);
      // Simulate emotion detection after 2s
      setTimeout(() => {
        const facial = emotions[Math.floor(Math.random() * emotions.length)];
        setResult(prev => ({
          facial,
          facialConfidence: Math.round(60 + Math.random() * 35),
          voice: prev?.voice || 'Not analyzed',
          voiceConfidence: prev?.voiceConfidence || 0,
        }));
      }, 2000);
    } catch {
      alert('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const toggleMic = async () => {
    if (micActive) {
      setMicActive(false);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicActive(true);
      // Simulate voice analysis after 3s
      setTimeout(() => {
        const voice = voiceEmotions[Math.floor(Math.random() * voiceEmotions.length)];
        setResult(prev => ({
          facial: prev?.facial || 'Not analyzed',
          facialConfidence: prev?.facialConfidence || 0,
          voice,
          voiceConfidence: Math.round(55 + Math.random() * 40),
        }));
        setMicActive(false);
      }, 3000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const emotionColor = (emotion: string) => {
    const map: Record<string, string> = {
      Happy: 'text-neuro-green', Sad: 'text-neuro-blue', Neutral: 'text-muted-foreground',
      Angry: 'text-neuro-rose', Surprised: 'text-neuro-amber', Calm: 'text-neuro-cyan',
      Stressed: 'text-neuro-rose',
    };
    return map[emotion] || 'text-foreground';
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neuro-amber to-neuro-green flex items-center justify-center">
          <Smile className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Emotion Analysis Module</h1>
          <p className="text-xs text-muted-foreground">Face & Voice Emotion Detection</p>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mb-6">
        <AlertCircle className="w-3 h-3" /> Simulated neural network classification — production models require TensorFlow.js integration
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Camera */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Facial Expression Detection
          </h3>
          <div className="aspect-video rounded-lg bg-secondary overflow-hidden mb-4 relative">
            {cameraActive ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button onClick={cameraActive ? stopCamera : startCamera} variant={cameraActive ? 'destructive' : 'neuro'} size="sm" className="w-full">
            {cameraActive ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>

        {/* Mic */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-accent" /> Voice Tone Analysis
          </h3>
          <div className="aspect-video rounded-lg bg-secondary overflow-hidden mb-4 relative flex items-center justify-center">
            {micActive ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-1.5 bg-accent rounded-full eeg-wave" style={{ height: `${20 + Math.random() * 40}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : (
              <MicOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <Button onClick={toggleMic} variant={micActive ? 'destructive' : 'neuro'} size="sm" className="w-full">
            {micActive ? 'Stop Recording' : 'Start Voice Analysis'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Emotion Detection Results</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Facial Emotion</p>
              <p className={`text-xl font-bold ${emotionColor(result.facial)}`}>{result.facial}</p>
              {result.facialConfidence > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${result.facialConfidence}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Confidence: {result.facialConfidence}%</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Voice Emotion</p>
              <p className={`text-xl font-bold ${emotionColor(result.voice)}`}>{result.voice}</p>
              {result.voiceConfidence > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full gradient-accent" style={{ width: `${result.voiceConfidence}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Confidence: {result.voiceConfidence}%</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
