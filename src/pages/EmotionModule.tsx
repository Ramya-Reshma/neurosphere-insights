import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Smile, Camera, Mic, MicOff, VideoOff, AlertCircle, Brain, Zap, ChevronDown, Activity, Volume2, Eye, Loader2, Info, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { VoiceAnalyzer, VoiceFeatures } from '@/lib/voice-analysis';
import { analyzeFacialEmotion, analyzeVoiceStress, performFusion, saveMultimodalSession, saveMoodEntry, FacialResult, VoiceResult, FusionResult } from '@/lib/multimodal-api';
import { EEGData, analyzeEEG } from '@/lib/eeg-processing';
import EEGInputPanel from '@/components/EEGInputPanel';
import { toast } from 'sonner';

type AnalysisStep = 'input' | 'analyzing' | 'results';

export default function EmotionModule() {
  const [step, setStep] = useState<AnalysisStep>('input');
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [facialResult, setFacialResult] = useState<FacialResult | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null);
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [liveVoiceFeatures, setLiveVoiceFeatures] = useState<Partial<VoiceFeatures>>({});
  const [analyzeProgress, setAnalyzeProgress] = useState('');
  const [techOpen, setTechOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const vizIntervalRef = useRef<number>(0);
  const vizCanvasRef = useRef<HTMLCanvasElement>(null);

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraActive(true);
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  // Capture frame as base64
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  // Mic with voice analyzer
  const startMic = async () => {
    try {
      const analyzer = new VoiceAnalyzer();
      await analyzer.start((features) => {
        setLiveVoiceFeatures(features);
      });
      voiceAnalyzerRef.current = analyzer;
      setMicActive(true);

      // Start audio visualization
      startVizualization(analyzer);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const stopMic = () => {
    setMicActive(false);
    clearInterval(vizIntervalRef.current);
  };

  const startVizualization = (analyzer: VoiceAnalyzer) => {
    const canvas = vizCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const freqData = analyzer.getFrequencyData();
      if (!freqData) return;

      ctx.fillStyle = 'hsl(220, 18%, 10%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / 64;
      for (let i = 0; i < 64; i++) {
        const val = freqData[i] / 255;
        const height = val * canvas.height * 0.8;
        const hue = 168 + (i / 64) * 92;
        ctx.fillStyle = `hsl(${hue}, 70%, ${40 + val * 30}%)`;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
      }
    };

    vizIntervalRef.current = window.setInterval(draw, 50);
  };

  // Full analysis pipeline
  const runAnalysis = async () => {
    if (!cameraActive && !micActive && !eegData) {
      toast.error('Please enable at least one input (camera, microphone, or EEG data).');
      return;
    }

    setAnalyzing(true);
    setStep('analyzing');
    let facial: FacialResult | null = null;
    let voice: VoiceResult | null = null;

    try {
      // Step 1: Facial analysis
      if (cameraActive) {
        setAnalyzeProgress('Analyzing facial expression...');
        const frame = captureFrame();
        if (frame) {
          facial = await analyzeFacialEmotion(frame);
          setFacialResult(facial);
        }
      }

      // Step 2: Voice analysis
      if (micActive && voiceAnalyzerRef.current) {
        setAnalyzeProgress('Analyzing voice patterns...');
        const features = voiceAnalyzerRef.current.stop();
        setMicActive(false);
        clearInterval(vizIntervalRef.current);
        voice = await analyzeVoiceStress(features);
        setVoiceResult(voice);
      }

      // Step 3: Multimodal fusion
      setAnalyzeProgress('Performing multimodal fusion...');
      const fusion = await performFusion(eegData, facial, voice);
      setFusionResult(fusion);

      // Step 4: Save results
      setAnalyzeProgress('Saving results...');
      try {
        await saveMultimodalSession({ eegData: eegData || undefined, facialResult: facial || undefined, voiceResult: voice || undefined, fusionResult: fusion });
        await saveMoodEntry(fusion.mood_label, {
          moodScore: fusion.neurosphere_score,
          energyLevel: fusion.energy_level,
          stressLevel: fusion.state_probabilities?.stressed || 0,
          focusLevel: fusion.state_probabilities?.focused || 0,
        });
      } catch { /* non-critical */ }

      // Check for stress alert
      if (fusion.alert_level === 'severe') {
        toast.error('⚠️ High stress detected! Consider a breathing exercise.', { duration: 8000 });
      } else if (fusion.alert_level === 'moderate') {
        toast.warning('Moderate stress indicators detected. Consider taking a break.', { duration: 5000 });
      }

      toast.success('Multimodal analysis complete!');
      setStep('results');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
      setStep('input');
    }

    setAnalyzing(false);
    setAnalyzeProgress('');
  };

  const handleEEGData = (data: EEGData) => {
    setEegData(data);
    toast.success('EEG data loaded');
  };

  const resetAnalysis = () => {
    setStep('input');
    setFacialResult(null);
    setVoiceResult(null);
    setFusionResult(null);
    setEegData(null);
    stopCamera();
    if (micActive) stopMic();
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(vizIntervalRef.current);
    };
  }, []);

  const emotionColor = (emotion: string) => {
    const map: Record<string, string> = {
      Happy: 'text-neuro-green', Sad: 'text-neuro-blue', Neutral: 'text-muted-foreground',
      Angry: 'text-neuro-rose', Surprised: 'text-neuro-amber', Calm: 'text-neuro-cyan',
      Stressed: 'text-neuro-rose', Fear: 'text-neuro-purple', Anxious: 'text-neuro-amber',
      Disgust: 'text-neuro-rose', Contempt: 'text-neuro-amber', Focused: 'text-neuro-blue',
      Fatigued: 'text-neuro-amber',
    };
    return map[emotion] || 'text-foreground';
  };

  const stateColor = (state: string) => {
    const map: Record<string, string> = {
      Calm: 'bg-neuro-green/15 text-neuro-green',
      Focused: 'bg-neuro-blue/15 text-neuro-blue',
      Stressed: 'bg-neuro-rose/15 text-neuro-rose',
      Fatigued: 'bg-neuro-amber/15 text-neuro-amber',
      Anxious: 'bg-neuro-purple/15 text-neuro-purple',
      Low: 'bg-neuro-green/15 text-neuro-green',
      Medium: 'bg-neuro-amber/15 text-neuro-amber',
      High: 'bg-neuro-rose/15 text-neuro-rose',
      Critical: 'bg-destructive/15 text-destructive',
    };
    return map[state] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neuro-amber to-neuro-green flex items-center justify-center">
          <Smile className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Multimodal Emotion Analysis</h1>
          <p className="text-xs text-muted-foreground">Real-time Face, Voice & EEG Fusion</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
            {/* Input Sources Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Camera */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Live Facial Detection
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">AI analyzes your live facial expression to detect emotions like happiness, sadness, anger, etc.</TooltipContent>
                  </Tooltip>
                </h3>
                <div className="aspect-video rounded-lg bg-secondary overflow-hidden mb-4 relative">
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-neuro-green/20 text-neuro-green text-[10px] px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-neuro-green animate-pulse" /> Live
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <VideoOff className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-[10px] text-muted-foreground">Camera not active</p>
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
                  <Mic className="w-4 h-4 text-accent" /> Live Voice Analysis
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">Real-time audio feature extraction: pitch, energy, speech rate, and spectral analysis for stress detection.</TooltipContent>
                  </Tooltip>
                </h3>
                <div className="aspect-video rounded-lg bg-secondary overflow-hidden mb-4 relative">
                  {micActive ? (
                    <>
                      <canvas ref={vizCanvasRef} width={400} height={200} className="w-full h-full" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Recording
                      </div>
                      {/* Live features overlay */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                        {liveVoiceFeatures.avgPitch != null && (
                          <span className="text-[9px] bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground">
                            Pitch: {Math.round(liveVoiceFeatures.avgPitch)} Hz
                          </span>
                        )}
                        {liveVoiceFeatures.avgEnergy != null && (
                          <span className="text-[9px] bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground">
                            Energy: {liveVoiceFeatures.avgEnergy.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <MicOff className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-[10px] text-muted-foreground">Microphone not active</p>
                    </div>
                  )}
                </div>
                <Button onClick={micActive ? stopMic : startMic} variant={micActive ? 'destructive' : 'neuro'} size="sm" className="w-full">
                  {micActive ? 'Stop Recording' : 'Start Voice Analysis'}
                </Button>
              </div>
            </div>

            {/* EEG Input (Collapsible) */}
            <Collapsible>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/30 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Brain className="w-4 h-4 text-neuro-cyan" /> EEG Signal Input (Optional)
                    {eegData && <span className="text-[10px] text-primary font-normal">✓ Loaded</span>}
                  </h3>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <EEGInputPanel onDataReady={handleEEGData} />
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Run Analysis */}
            <Button onClick={runAnalysis} variant="neuro" className="w-full py-6 text-sm" disabled={analyzing || (!cameraActive && !micActive && !eegData)}>
              <Zap className="w-4 h-4 mr-2" /> Run Multimodal Analysis
            </Button>

            {(!cameraActive && !micActive && !eegData) && (
              <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Enable at least one input source to begin analysis
              </p>
            )}
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 animate-pulse glow-primary">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">{analyzeProgress || 'Processing...'}</p>
            <p className="text-[10px] text-muted-foreground mt-1">AI is analyzing your inputs in real-time</p>
          </motion.div>
        )}

        {step === 'results' && fusionResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Mental State Summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-primary mb-1">AI Multimodal Summary</p>
                  <p className="text-sm text-foreground leading-relaxed">{fusionResult.explanation?.reasoning}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Brain className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-[10px] text-muted-foreground">NeuroSphere Score</p>
                <p className="text-2xl font-bold text-foreground">{fusionResult.neurosphere_score}</p>
                <p className="text-[10px] text-muted-foreground">/ 100</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Activity className="w-5 h-5 mx-auto text-accent mb-2" />
                <p className="text-[10px] text-muted-foreground">Mental State</p>
                <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${stateColor(fusionResult.mental_state)}`}>
                  {fusionResult.mental_state}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Shield className="w-5 h-5 mx-auto text-neuro-amber mb-2" />
                <p className="text-[10px] text-muted-foreground">Burnout Risk</p>
                <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${stateColor(fusionResult.burnout_risk)}`}>
                  {fusionResult.burnout_risk}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Zap className="w-5 h-5 mx-auto text-neuro-green mb-2" />
                <p className="text-[10px] text-muted-foreground">Energy Level</p>
                <p className="text-2xl font-bold text-foreground">{fusionResult.energy_level}%</p>
              </div>
            </div>

            {/* State Probabilities Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Mental State Probabilities</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(fusionResult.state_probabilities || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} stroke="hsl(220, 14%, 18%)" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} stroke="hsl(220, 14%, 18%)" domain={[0, 100]} />
                    <Bar dataKey="value" fill="hsl(168, 80%, 48%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Facial */}
              {facialResult && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" /> Facial Emotion
                  </h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className={`text-2xl font-bold ${emotionColor(facialResult.emotion)}`}>{facialResult.emotion}</p>
                      <p className="text-xs text-muted-foreground">Confidence: {facialResult.confidence}%</p>
                      {facialResult.secondary_emotion && (
                        <p className="text-[10px] text-muted-foreground mt-1">Secondary: {facialResult.secondary_emotion} ({facialResult.secondary_confidence}%)</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">Valence</span>
                            <span className="text-foreground">{facialResult.valence > 0 ? '+' : ''}{facialResult.valence?.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-neuro-cyan" style={{ width: `${(facialResult.valence + 1) / 2 * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">Arousal</span>
                            <span className="text-foreground">{facialResult.arousal?.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-neuro-purple" style={{ width: `${(facialResult.arousal || 0) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Voice */}
              {voiceResult && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-accent" /> Voice Stress Analysis
                  </h3>
                  <div>
                    <p className={`text-2xl font-bold ${emotionColor(voiceResult.emotion)}`}>{voiceResult.emotion}</p>
                    <p className="text-xs text-muted-foreground">Stress Score: {voiceResult.stress_score}%</p>
                    <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${voiceResult.stress_score}%` }} className={`h-full rounded-full ${voiceResult.stress_score > 70 ? 'bg-neuro-rose' : voiceResult.stress_score > 40 ? 'bg-neuro-amber' : 'bg-neuro-green'}`} />
                    </div>
                    {voiceResult.indicators && voiceResult.indicators.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {voiceResult.indicators.map((ind, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{ind}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Explainable AI */}
            <Collapsible open={techOpen} onOpenChange={setTechOpen}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/30 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Explainable AI — Why this prediction?
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${techOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {fusionResult.explanation?.primary_factors && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Primary Factors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fusionResult.explanation.primary_factors.map((f, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {fusionResult.explanation?.eeg_contribution && (
                        <div className="rounded-lg bg-secondary/50 p-2.5">
                          <p className="text-[10px] text-neuro-cyan font-medium mb-1">EEG Contribution</p>
                          <p className="text-[10px] text-muted-foreground">{fusionResult.explanation.eeg_contribution}</p>
                        </div>
                      )}
                      {fusionResult.explanation?.facial_contribution && (
                        <div className="rounded-lg bg-secondary/50 p-2.5">
                          <p className="text-[10px] text-neuro-green font-medium mb-1">Facial Contribution</p>
                          <p className="text-[10px] text-muted-foreground">{fusionResult.explanation.facial_contribution}</p>
                        </div>
                      )}
                      {fusionResult.explanation?.voice_contribution && (
                        <div className="rounded-lg bg-secondary/50 p-2.5">
                          <p className="text-[10px] text-neuro-purple font-medium mb-1">Voice Contribution</p>
                          <p className="text-[10px] text-muted-foreground">{fusionResult.explanation.voice_contribution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Recommendations */}
            {fusionResult.recommendations && fusionResult.recommendations.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">AI Recommendations</h3>
                <ul className="space-y-2">
                  {fusionResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="neuro" onClick={resetAnalysis}>New Analysis</Button>
              <Button variant="neuro-outline" onClick={() => window.location.href = '/meditation'}>
                🧘 Meditation Mode
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
