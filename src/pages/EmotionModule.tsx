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
import LiveBrainwave from '@/components/LiveBrainwave';
import { computeCognitiveMetrics, generateBrainwaveFromAudio, type CognitiveMetrics } from '@/lib/cognitive-engine';
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
  const [cogMetrics, setCogMetrics] = useState<CognitiveMetrics | null>(null);

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

      // Gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, 'hsl(225, 20%, 96%)');
      bgGrad.addColorStop(1, 'hsl(245, 20%, 94%)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / 64;
      for (let i = 0; i < 64; i++) {
        const val = freqData[i] / 255;
        const height = val * canvas.height * 0.8;
        const hue = 190 + (i / 64) * 70;
        const grad = ctx.createLinearGradient(0, canvas.height - height, 0, canvas.height);
        grad.addColorStop(0, `hsla(${hue}, 72%, 62%, 0.9)`);
        grad.addColorStop(1, `hsla(${hue}, 72%, 62%, 0.3)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(i * barWidth, canvas.height - height, barWidth - 1, height, 2);
        ctx.fill();
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
      if (cameraActive) {
        setAnalyzeProgress('Analyzing facial expression...');
        const frame = captureFrame();
        if (frame) {
          facial = await analyzeFacialEmotion(frame);
          setFacialResult(facial);
        }
      }

      if (micActive && voiceAnalyzerRef.current) {
        setAnalyzeProgress('Analyzing voice patterns...');
        const features = voiceAnalyzerRef.current.stop();
        setMicActive(false);
        clearInterval(vizIntervalRef.current);
        voice = await analyzeVoiceStress(features);
        setVoiceResult(voice);
      }

      setAnalyzeProgress('Performing multimodal fusion...');
      const fusion = await performFusion(eegData, facial, voice);
      setFusionResult(fusion);

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
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neuro-amber to-neuro-green flex items-center justify-center shadow-elevated">
          <Smile className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Multimodal Emotion Analysis</h1>
          <p className="text-xs text-muted-foreground">Real-time Face, Voice & EEG Fusion</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
            {/* Input Sources Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Camera */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Live Facial Detection
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">AI analyzes your live facial expression to detect emotions.</TooltipContent>
                  </Tooltip>
                </h3>
                <div className="aspect-video rounded-xl bg-muted/50 overflow-hidden mb-4 relative border border-border/50">
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 glass px-2 py-0.5 rounded-full">
                        <div className="status-dot bg-neuro-green animate-pulse" style={{ width: 6, height: 6 }} />
                        <span className="text-[10px] font-medium text-foreground">Live</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <VideoOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-[10px] text-muted-foreground">Awaiting real-time data...</p>
                    </div>
                  )}
                </div>
                <Button onClick={cameraActive ? stopCamera : startCamera} variant={cameraActive ? 'destructive' : 'neuro'} size="sm" className="w-full rounded-xl">
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </Button>
              </div>

              {/* Mic */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-accent" /> Live Voice Analysis
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">Real-time audio feature extraction for stress detection.</TooltipContent>
                  </Tooltip>
                </h3>
                <div className="aspect-video rounded-xl bg-muted/50 overflow-hidden mb-4 relative border border-border/50">
                  {micActive ? (
                    <>
                      <canvas ref={vizCanvasRef} width={400} height={200} className="w-full h-full" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 glass px-2 py-0.5 rounded-full">
                        <div className="status-dot bg-accent animate-pulse" style={{ width: 6, height: 6 }} />
                        <span className="text-[10px] font-medium text-foreground">Recording</span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                        {liveVoiceFeatures.avgPitch != null && (
                          <span className="text-[9px] glass px-2 py-0.5 rounded-lg text-foreground font-medium">
                            Pitch: {Math.round(liveVoiceFeatures.avgPitch)} Hz
                          </span>
                        )}
                        {liveVoiceFeatures.avgEnergy != null && (
                          <span className="text-[9px] glass px-2 py-0.5 rounded-lg text-foreground font-medium">
                            Energy: {liveVoiceFeatures.avgEnergy.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <MicOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-[10px] text-muted-foreground">Awaiting real-time data...</p>
                    </div>
                  )}
                </div>
                <Button onClick={micActive ? stopMic : startMic} variant={micActive ? 'destructive' : 'neuro'} size="sm" className="w-full rounded-xl">
                  {micActive ? 'Stop Recording' : 'Start Voice Analysis'}
                </Button>
              </div>
            </div>

            {/* EEG Input */}
            <Collapsible>
              <div className="glass-card rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-colors">
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
            <Button onClick={runAnalysis} variant="neuro" className="w-full py-6 text-sm rounded-2xl shadow-elevated" disabled={analyzing || (!cameraActive && !micActive && !eegData)}>
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
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-6 animate-pulse-glow shadow-elevated">
              <Brain className="w-12 h-12 text-primary-foreground" />
            </div>
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">{analyzeProgress || 'Processing...'}</p>
            <p className="text-[10px] text-muted-foreground mt-1">AI is analyzing your real-time inputs</p>
          </motion.div>
        )}

        {step === 'results' && fusionResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Mental State Summary */}
            <div className="glass-card rounded-2xl border-primary/15 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">AI Multimodal Summary</p>
                  <p className="text-sm text-foreground leading-relaxed">{fusionResult.explanation?.reasoning}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="metric-card text-center">
                <Brain className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-[10px] text-muted-foreground">NeuroSphere Score</p>
                <p className="text-3xl font-bold text-foreground">{fusionResult.neurosphere_score}</p>
                <p className="text-[10px] text-muted-foreground">/ 100</p>
              </div>
              <div className="metric-card text-center">
                <Activity className="w-5 h-5 mx-auto text-accent mb-2" />
                <p className="text-[10px] text-muted-foreground">Mental State</p>
                <span className={`inline-block mt-1 text-xs font-medium px-3 py-1 rounded-full ${stateColor(fusionResult.mental_state)}`}>
                  {fusionResult.mental_state}
                </span>
              </div>
              <div className="metric-card text-center">
                <Shield className="w-5 h-5 mx-auto text-neuro-amber mb-2" />
                <p className="text-[10px] text-muted-foreground">Burnout Risk</p>
                <span className={`inline-block mt-1 text-xs font-medium px-3 py-1 rounded-full ${stateColor(fusionResult.burnout_risk)}`}>
                  {fusionResult.burnout_risk}
                </span>
              </div>
              <div className="metric-card text-center">
                <Zap className="w-5 h-5 mx-auto text-neuro-green mb-2" />
                <p className="text-[10px] text-muted-foreground">Energy Level</p>
                <p className="text-3xl font-bold text-foreground">{fusionResult.energy_level}%</p>
              </div>
            </div>

            {/* State Probabilities Chart */}
            <div className="chart-glass">
              <h3 className="text-sm font-semibold text-foreground mb-3">Mental State Probabilities</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(fusionResult.state_probabilities || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" domain={[0, 100]} />
                    <Bar dataKey="value" fill="hsl(245, 72%, 62%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {facialResult && (
                <div className="glass-card rounded-2xl p-5">
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
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">Valence</span>
                          <span className="text-foreground font-medium">{facialResult.valence > 0 ? '+' : ''}{facialResult.valence?.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-neuro-cyan transition-all" style={{ width: `${(facialResult.valence + 1) / 2 * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">Arousal</span>
                          <span className="text-foreground font-medium">{facialResult.arousal?.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-neuro-purple transition-all" style={{ width: `${(facialResult.arousal || 0) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {voiceResult && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-accent" /> Voice Stress Analysis
                  </h3>
                  <div>
                    <p className={`text-2xl font-bold ${emotionColor(voiceResult.emotion)}`}>{voiceResult.emotion}</p>
                    <p className="text-xs text-muted-foreground">Stress Score: {voiceResult.stress_score}%</p>
                    <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${voiceResult.stress_score}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${voiceResult.stress_score > 70 ? 'bg-neuro-rose' : voiceResult.stress_score > 40 ? 'bg-neuro-amber' : 'bg-neuro-green'}`} />
                    </div>
                    {voiceResult.indicators && voiceResult.indicators.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {voiceResult.indicators.map((ind, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ind}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Explainable AI */}
            <Collapsible open={techOpen} onOpenChange={setTechOpen}>
              <div className="glass-card rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 hover:bg-muted/20 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="status-dot bg-accent" /> Explainable AI — Why this prediction?
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${techOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-3">
                    {fusionResult.explanation?.primary_factors && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">Primary Factors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fusionResult.explanation.primary_factors.map((f, i) => (
                            <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {fusionResult.explanation?.eeg_contribution && (
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-[10px] text-neuro-cyan font-semibold mb-1">EEG Contribution</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{fusionResult.explanation.eeg_contribution}</p>
                        </div>
                      )}
                      {fusionResult.explanation?.facial_contribution && (
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-[10px] text-neuro-green font-semibold mb-1">Facial Contribution</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{fusionResult.explanation.facial_contribution}</p>
                        </div>
                      )}
                      {fusionResult.explanation?.voice_contribution && (
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-[10px] text-neuro-violet font-semibold mb-1">Voice Contribution</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{fusionResult.explanation.voice_contribution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Recommendations */}
            {fusionResult.recommendations && fusionResult.recommendations.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">AI Recommendations</h3>
                <ul className="space-y-2">
                  {fusionResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="text-primary mt-0.5 flex-shrink-0">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="neuro" onClick={resetAnalysis} className="rounded-xl">New Analysis</Button>
              <Button variant="neuro-outline" onClick={() => window.location.href = '/meditation'} className="rounded-xl">
                🧘 Meditation Mode
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
