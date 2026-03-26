import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Camera, Mic, Brain, AlertTriangle, Trophy, ArrowRight, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeFacialEmotion, analyzeVoiceStress } from '@/lib/multimodal-api';
import { VoiceAnalyzer } from '@/lib/voice-analysis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GameType = 'emotion_detection' | 'stress_challenge' | 'truth_lie';

interface GameRound {
  prompt: string;
  targetEmotion?: string;
  result?: string;
  correct?: boolean;
  score: number;
}

export default function GameModePage() {
  const [game, setGame] = useState<GameType | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const emotionPrompts: { prompt: string; targetEmotion?: string }[] = [
    { prompt: 'Show a HAPPY face!', targetEmotion: 'Happy' },
    { prompt: 'Look SURPRISED!', targetEmotion: 'Surprise' },
    { prompt: 'Express SADNESS', targetEmotion: 'Sad' },
    { prompt: 'Show ANGER', targetEmotion: 'Angry' },
    { prompt: 'Stay perfectly NEUTRAL', targetEmotion: 'Neutral' },
  ];

  const stressPrompts: { prompt: string; targetEmotion?: string }[] = [
    { prompt: 'Speak calmly about your favorite place' },
    { prompt: 'Count backwards from 100 by 7s quickly' },
    { prompt: 'Describe a stressful situation you handled well' },
  ];

  const truthLiePrompts: { prompt: string; targetEmotion?: string }[] = [
    { prompt: 'Tell a TRUE story about your morning' },
    { prompt: 'Make up a FICTIONAL story about yesterday' },
    { prompt: 'Say something TRUE about yourself' },
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
      setCameraActive(true);
    } catch { toast.error('Camera access denied'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const c = canvasRef.current; const v = videoRef.current;
    c.width = v.videoWidth || 480; c.height = v.videoHeight || 360;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  const startGame = async (type: GameType) => {
    setGame(type);
    setRounds([]);
    setCurrentRound(0);
    setTotalScore(0);
    setGameComplete(false);
    await startCamera();
  };

  const playRound = async () => {
    if (!cameraActive || analyzing) return;
    setAnalyzing(true);

    try {
      const frame = captureFrame();
      if (!frame) throw new Error('Could not capture frame');

      const result = await analyzeFacialEmotion(frame);

      let score = 0;
      let correct = false;
      const prompts = game === 'emotion_detection' ? emotionPrompts : game === 'stress_challenge' ? stressPrompts : truthLiePrompts;
      const currentPrompt = prompts[currentRound % prompts.length];

      if (game === 'emotion_detection' && currentPrompt.targetEmotion) {
        correct = result.emotion === currentPrompt.targetEmotion;
        score = correct ? 20 : Math.round(result.confidence / 10);
      } else {
        score = Math.round(result.confidence / 5);
      }

      const round: GameRound = {
        prompt: currentPrompt.prompt,
        targetEmotion: currentPrompt.targetEmotion,
        result: `${result.emotion} (${result.confidence}%)`,
        correct,
        score,
      };

      const newRounds = [...rounds, round];
      setRounds(newRounds);
      setTotalScore(prev => prev + score);

      if (newRounds.length >= 5) {
        setGameComplete(true);
        stopCamera();
        // Save game log
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await (supabase as any).from('game_logs').insert({
              user_id: user.id,
              game_type: game!,
              score: totalScore + score,
              rounds: newRounds.length,
              details: { rounds: newRounds },
            });
          }
        } catch { /* non-critical */ }
      } else {
        setCurrentRound(prev => prev + 1);
      }
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    }
    setAnalyzing(false);
  };

  useEffect(() => { return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  const getCurrentPrompt = () => {
    const prompts = game === 'emotion_detection' ? emotionPrompts : game === 'stress_challenge' ? stressPrompts : truthLiePrompts;
    return prompts[currentRound % prompts.length];
  };

  const games = [
    { type: 'emotion_detection' as GameType, icon: Camera, label: 'Emotion Detection', desc: 'Match your facial expression to the prompt. AI analyzes in real-time.', gradient: 'from-neuro-cyan to-neuro-blue' },
    { type: 'stress_challenge' as GameType, icon: Brain, label: 'Stress Challenge', desc: 'Perform tasks while AI monitors your stress response patterns.', gradient: 'from-neuro-violet to-neuro-purple' },
    { type: 'truth_lie' as GameType, icon: Shield, label: 'Truth vs Lie', desc: 'Probabilistic analysis of facial micro-expressions during statements.', gradient: 'from-neuro-pink to-neuro-rose' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neuro-amber to-neuro-green flex items-center justify-center shadow-elevated">
          <Gamepad2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">AI Interactive Lab</h1>
          <p className="text-xs text-muted-foreground">Research-oriented cognitive interaction modules</p>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="glass-card rounded-2xl p-4 mb-6 border-neuro-amber/20 bg-neuro-amber/5">
        <div className="flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-neuro-amber flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Scientific Disclaimer:</strong> These modules use probabilistic AI analysis for research and educational purposes only. Results are estimations based on observable patterns and should not be used for clinical diagnosis, legal proceedings, or definitive conclusions about mental states.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!game ? (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {games.map(g => (
              <button key={g.type} onClick={() => startGame(g.type)} className="glass-card rounded-2xl p-5 text-left group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <g.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{g.label}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{g.desc}</p>
              </button>
            ))}
          </motion.div>
        ) : gameComplete ? (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto text-neuro-amber mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
            <p className="text-3xl font-black text-gradient-primary mb-4">{totalScore} pts</p>
            <div className="space-y-2 mb-6 max-w-md mx-auto">
              {rounds.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs glass rounded-xl px-3 py-2">
                  <span className="text-muted-foreground">Round {i + 1}</span>
                  <span className="text-foreground font-medium">{r.result}</span>
                  <span className={`font-bold ${r.correct ? 'text-neuro-green' : 'text-muted-foreground'}`}>+{r.score}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="neuro" onClick={() => startGame(game)}><RefreshCw className="w-4 h-4 mr-1" /> Play Again</Button>
              <Button variant="neuro-outline" onClick={() => { setGame(null); setGameComplete(false); }}>Back to Lab</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Progress */}
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i < rounds.length ? 'bg-primary' : i === rounds.length ? 'bg-primary/40 animate-pulse' : 'bg-muted'}`} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Camera */}
              <div className="glass-card rounded-2xl p-5">
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
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground">Awaiting real-time data...</p>
                    </div>
                  )}
                </div>
                <Button onClick={playRound} variant="neuro" className="w-full rounded-xl" disabled={analyzing || !cameraActive}>
                  {analyzing ? 'Analyzing...' : 'Capture & Analyze'}
                </Button>
              </div>

              {/* Prompt & Score */}
              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Round {currentRound + 1} of 5</p>
                  <p className="text-lg font-bold text-foreground">{getCurrentPrompt().prompt}</p>
                  {getCurrentPrompt().targetEmotion && (
                    <p className="text-xs text-primary mt-2">Target: {getCurrentPrompt().targetEmotion}</p>
                  )}
                </div>

                <div className="metric-card text-center">
                  <p className="text-[10px] text-muted-foreground">Current Score</p>
                  <p className="text-3xl font-black text-foreground">{totalScore}</p>
                </div>

                {rounds.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <p className="text-[10px] text-muted-foreground mb-2">Last Result</p>
                    <p className="text-sm font-semibold text-foreground">{rounds[rounds.length - 1].result}</p>
                    <p className={`text-xs ${rounds[rounds.length - 1].correct ? 'text-neuro-green' : 'text-muted-foreground'}`}>
                      {rounds[rounds.length - 1].correct ? '✓ Matched!' : 'Try harder!'} +{rounds[rounds.length - 1].score} pts
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { stopCamera(); setGame(null); }} className="text-xs text-muted-foreground">
              ← Exit Game
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
