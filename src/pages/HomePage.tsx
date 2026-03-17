import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Activity, Zap, Eye, Mic, BarChart3, Cpu, Sparkles, TrendingUp, Target, Heart, Layers, Shield, Waves } from 'lucide-react';
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

  const cognitiveMetrics = [
    { label: 'Focus Level', value: metrics.focusLevel, color: 'bg-neuro-violet', textColor: 'text-neuro-violet', icon: Target },
    { label: 'Stress Level', value: metrics.stressLevel, color: 'bg-neuro-rose', textColor: 'text-neuro-rose', icon: Activity },
    { label: 'Creativity Index', value: metrics.creativityIndex, color: 'bg-neuro-cyan', textColor: 'text-neuro-cyan', icon: Sparkles },
    { label: 'Emotional Stability', value: metrics.emotionalStability, color: 'bg-neuro-green', textColor: 'text-neuro-green', icon: Heart },
  ];

  const features = [
    { icon: Brain, label: 'Brainwave Detection', desc: 'Real-time Alpha, Beta, Gamma, Theta analysis', gradient: 'from-neuro-violet to-neuro-blue' },
    { icon: Cpu, label: 'Cognitive Intelligence', desc: 'Focus, stress, and fatigue scoring', gradient: 'from-neuro-blue to-neuro-cyan' },
    { icon: Eye, label: 'Emotion Recognition', desc: 'Live facial expression detection', gradient: 'from-neuro-cyan to-neuro-green' },
    { icon: BarChart3, label: 'Neural Visualization', desc: 'Interactive brainwave charts', gradient: 'from-neuro-green to-neuro-amber' },
    { icon: Zap, label: 'AI Signal Processing', desc: 'Advanced multimodal fusion engine', gradient: 'from-neuro-pink to-neuro-violet' },
    { icon: Shield, label: 'Burnout Detection', desc: 'Early warning system with AI', gradient: 'from-neuro-rose to-neuro-amber' },
  ];

  const shortcuts = [
    { to: '/modules', label: 'Start Analysis', icon: Brain, desc: 'Run EEG, Face & Voice', gradient: 'from-neuro-violet to-neuro-blue' },
    { to: '/modules', label: 'Modules', icon: Layers, desc: 'Access all 6 modules', gradient: 'from-neuro-blue to-neuro-cyan' },
    { to: '/results', label: 'Results', icon: BarChart3, desc: 'Latest analysis data', gradient: 'from-neuro-cyan to-neuro-green' },
    { to: '/tracking', label: 'Tracking', icon: TrendingUp, desc: 'Historical sessions', gradient: 'from-neuro-pink to-neuro-violet' },
  ];

  return (
    <div className="relative min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-16">
        <NeuralBackground />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow shadow-elevated">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase mb-1">NeuroInsight</p>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
                  AI-Powered Brain Signal Intelligence
                </h1>
              </div>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground max-w-2xl mt-3 leading-relaxed">
              A real-time AI platform that analyzes cognitive states, emotional signals, and behavioral patterns using neural and sensory data.
            </p>
            <div className="flex gap-3 mt-7">
              <Link to="/modules">
                <Button variant="neuro" size="lg" className="shadow-elevated rounded-xl px-6">
                  <Brain className="w-4 h-4 mr-2" /> Start Brain Analysis
                </Button>
              </Link>
              <Link to="/modules">
                <Button variant="neuro-outline" size="lg" className="rounded-xl px-6">
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
            {cognitiveMetrics.map((m) => (
              <motion.div key={m.label} variants={item} className="metric-card">
                <div className="flex items-center gap-2 mb-3">
                  <m.icon className={`w-4 h-4 ${m.textColor}`} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</p>
                </div>
                <p className={`text-3xl font-bold ${m.textColor}`}>{m.value > 0 ? `${m.value}%` : '—'}</p>
                <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className={`h-full rounded-full ${m.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* AI Insight Preview */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="glass-card rounded-2xl border-primary/15 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary mb-1 tracking-wide uppercase">Today's Neural Insight</p>
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
              { step: '01', icon: Mic, label: 'Record Signals', desc: 'EEG, Camera, Microphone' },
              { step: '02', icon: Brain, label: 'AI Pattern Detection', desc: 'Neural network processing' },
              { step: '03', icon: BarChart3, label: 'Cognitive Analysis', desc: 'Multimodal fusion' },
              { step: '04', icon: Sparkles, label: 'Insight Generation', desc: 'Explainable AI results' },
            ].map((s) => (
              <div key={s.step} className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                <span className="text-5xl font-black text-primary/6 absolute -top-3 -right-2 select-none">{s.step}</span>
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
              <motion.div key={f.label} variants={item} className="glass-card rounded-2xl p-5 group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Latest Analysis Snapshot */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">Latest Analysis Snapshot</h2>
          <div className="glass-card rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-neuro-violet/10 flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-neuro-violet" />
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Focus Score</p>
                <p className="text-xl font-bold text-foreground">{metrics.latestFocus > 0 ? `${metrics.latestFocus}%` : '—'}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-neuro-rose/10 flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5 text-neuro-rose" />
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Stress Level</p>
                <p className="text-xl font-bold text-foreground">{metrics.latestStress}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-neuro-pink/10 flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-neuro-pink" />
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Emotion Status</p>
                <p className="text-xl font-bold text-foreground">{metrics.latestEmotion}</p>
              </div>
            </div>
            <Link to="/results" className="block mt-5">
              <Button variant="neuro-outline" size="sm" className="w-full rounded-xl">
                View Full Analysis <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={container} initial="hidden" animate="show">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {shortcuts.map((s) => (
              <motion.div key={s.label} variants={item}>
                <Link to={s.to} className="block glass-card rounded-2xl p-4 group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="w-5 h-5 text-primary-foreground" />
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
