import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Activity, Zap, Eye, Mic, BarChart3, Cpu, Sparkles, TrendingUp, Target, Heart, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/NeuralBackground';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

interface LatestMetrics {
  focusLevel: number;
  stressLevel: number;
  creativityIndex: number;
  emotionalStability: number;
  latestInsight: string;
  latestFocus: number;
  latestStress: string;
  latestEmotion: string;
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<LatestMetrics>({
    focusLevel: 0, stressLevel: 0, creativityIndex: 0, emotionalStability: 0,
    latestInsight: '', latestFocus: 0, latestStress: 'N/A', latestEmotion: 'N/A',
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [analysisRes, sessionRes] = await Promise.all([
        supabase.from('analysis_history').select('results, module_type, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('multimodal_sessions').select('mental_state, neurosphere_score, burnout_risk, facial_emotion, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const analyses = analysisRes.data || [];
      const sessions = (sessionRes.data || []) as any[];

      let focusLevel = 0, stressLevel = 0, creativityIndex = 0, emotionalStability = 0;
      let latestInsight = 'Complete your first analysis to receive AI-generated neural insights about your cognitive patterns.';
      let latestFocus = 0, latestStress = 'N/A', latestEmotion = 'N/A';

      if (analyses.length > 0) {
        const r = analyses[0].results as any;
        latestFocus = r?.focusLevel || r?.rawScores?.focus || 0;
        latestStress = r?.stressLevel || 'N/A';
        focusLevel = r?.rawScores?.focus || latestFocus;
        stressLevel = r?.rawScores?.stress || 0;
        creativityIndex = Math.min(100, Math.round((r?.rawScores?.cognitive || 0) * 1.2));
        emotionalStability = Math.max(0, 100 - (r?.rawScores?.stress || 0));
      }
      if (sessions.length > 0) {
        latestEmotion = sessions[0].facial_emotion || sessions[0].mental_state || 'N/A';
        const score = sessions[0].neurosphere_score || 0;
        if (score > 70) latestInsight = `Your NeuroSphere score of ${score}/100 indicates strong cognitive performance. Neural patterns suggest high engagement and balanced mental activity.`;
        else if (score > 40) latestInsight = `Your NeuroSphere score of ${score}/100 shows moderate cognitive activity. Consider a focus session or meditation to optimize neural patterns.`;
        else if (score > 0) latestInsight = `Your NeuroSphere score of ${score}/100 suggests lower cognitive engagement. A rest period or breathing exercise may help restore neural balance.`;
      }

      setMetrics({ focusLevel, stressLevel, creativityIndex, emotionalStability, latestInsight, latestFocus, latestStress, latestEmotion });
    } catch { /* ignore */ }
  };

  const features = [
    { icon: Brain, label: 'Brainwave Pattern Detection', desc: 'Real-time Alpha, Beta, Gamma, Theta analysis', gradient: 'from-neuro-violet to-neuro-blue' },
    { icon: Cpu, label: 'Cognitive Intelligence Analysis', desc: 'Focus, stress, and fatigue scoring', gradient: 'from-neuro-blue to-neuro-cyan' },
    { icon: Eye, label: 'Emotion Recognition', desc: 'Live facial expression detection via AI', gradient: 'from-neuro-cyan to-neuro-green' },
    { icon: BarChart3, label: 'Neural Data Visualization', desc: 'Interactive brainwave charts and graphs', gradient: 'from-neuro-green to-neuro-amber' },
    { icon: Zap, label: 'AI-Driven Signal Processing', desc: 'Advanced multimodal fusion engine', gradient: 'from-neuro-pink to-neuro-violet' },
  ];

  const shortcuts = [
    { to: '/modules', label: 'Start Brain Analysis', icon: Brain, desc: 'Run EEG, Face & Voice analysis', gradient: 'from-neuro-violet to-neuro-blue' },
    { to: '/modules', label: 'Open Modules Workspace', icon: Layers, desc: 'Access all 6 analysis modules', gradient: 'from-neuro-blue to-neuro-cyan' },
    { to: '/results', label: 'View Results', icon: BarChart3, desc: 'See latest analysis outputs', gradient: 'from-neuro-cyan to-neuro-green' },
    { to: '/tracking', label: 'Analysis Tracking', icon: TrendingUp, desc: 'Historical session timeline', gradient: 'from-neuro-pink to-neuro-violet' },
  ];

  return (
    <div className="relative min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-16">
        <NeuralBackground />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary tracking-widest uppercase">NeuroInsight</p>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
                  AI-Powered Brain Signal Intelligence
                </h1>
              </div>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground max-w-2xl mt-3 leading-relaxed">
              A real-time AI platform that analyzes cognitive states, emotional signals, and behavioral patterns using neural and sensory data.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/modules">
                <Button variant="neuro" size="lg" className="shadow-elevated">
                  <Brain className="w-4 h-4 mr-2" /> Start Brain Analysis
                </Button>
              </Link>
              <Link to="/modules">
                <Button variant="neuro-outline" size="lg">
                  Explore Modules <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="px-6 lg:px-10 max-w-5xl mx-auto space-y-10 pb-12">
        {/* Cognitive Score Preview */}
        <motion.section variants={container} initial="hidden" animate="show">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Cognitive Score Preview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Focus Level', value: metrics.focusLevel, color: 'text-neuro-violet', bg: 'bg-neuro-violet/10' },
              { label: 'Stress Level', value: metrics.stressLevel, color: 'text-neuro-rose', bg: 'bg-neuro-rose/10' },
              { label: 'Creativity Index', value: metrics.creativityIndex, color: 'text-neuro-cyan', bg: 'bg-neuro-cyan/10' },
              { label: 'Emotional Stability', value: metrics.emotionalStability, color: 'text-neuro-green', bg: 'bg-neuro-green/10' },
            ].map((m) => (
              <motion.div key={m.label} variants={item} className={`rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-shadow`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value > 0 ? `${m.value}%` : '—'}</p>
                <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1, delay: 0.3 }} className={`h-full rounded-full ${m.bg.replace('/10', '')}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* AI Insight Preview */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-card">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Today's Neural Insight</p>
                <p className="text-sm text-foreground leading-relaxed">{metrics.latestInsight}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How NeuroInsight Works */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">How NeuroInsight Works</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: '1', icon: Mic, label: 'Record Signals', desc: 'EEG, Camera, Microphone' },
              { step: '2', icon: Brain, label: 'AI Brain Pattern Detection', desc: 'Neural network processing' },
              { step: '3', icon: BarChart3, label: 'Cognitive & Emotional Analysis', desc: 'Multimodal fusion' },
              { step: '4', icon: Sparkles, label: 'Insight Generation', desc: 'Explainable AI results' },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-card p-4 shadow-card relative overflow-hidden group hover:border-primary/30 hover:shadow-elevated transition-all">
                <span className="text-4xl font-black text-primary/8 absolute -top-2 -right-1">{s.step}</span>
                <s.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Feature Cards */}
        <motion.section variants={container} initial="hidden" animate="show">
          <h2 className="text-sm font-semibold text-foreground mb-4">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <motion.div key={f.label} variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Latest Analysis Snapshot */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">Latest Analysis Snapshot</h2>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Target className="w-5 h-5 mx-auto text-neuro-violet mb-2" />
                <p className="text-[10px] text-muted-foreground">Focus Score</p>
                <p className="text-lg font-bold text-foreground">{metrics.latestFocus > 0 ? `${metrics.latestFocus}%` : '—'}</p>
              </div>
              <div className="text-center">
                <Activity className="w-5 h-5 mx-auto text-neuro-rose mb-2" />
                <p className="text-[10px] text-muted-foreground">Stress Level</p>
                <p className="text-lg font-bold text-foreground">{metrics.latestStress}</p>
              </div>
              <div className="text-center">
                <Heart className="w-5 h-5 mx-auto text-neuro-pink mb-2" />
                <p className="text-[10px] text-muted-foreground">Emotion Status</p>
                <p className="text-lg font-bold text-foreground">{metrics.latestEmotion}</p>
              </div>
            </div>
            <Link to="/results" className="block mt-4">
              <Button variant="neuro-outline" size="sm" className="w-full">
                View Full Analysis <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Smart Navigation Shortcuts */}
        <motion.section variants={container} initial="hidden" animate="show">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {shortcuts.map((s) => (
              <motion.div key={s.label} variants={item}>
                <Link to={s.to} className="block rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all group">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <s.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">{s.label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
