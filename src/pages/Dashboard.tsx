import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, GraduationCap, Building2, HeartPulse, Search, Smile, ArrowRight, Activity, Waves, Cpu, Users, TrendingUp, Heart, AlertTriangle, Zap, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const modules = [
  { to: '/student', icon: GraduationCap, label: 'Student Module', desc: 'Focus & Stress Analysis', color: 'from-neuro-cyan to-neuro-blue' },
  { to: '/workplace', icon: Building2, label: 'Workplace Module', desc: 'Cognitive Load Monitoring', color: 'from-neuro-blue to-neuro-purple' },
  { to: '/healthcare', icon: HeartPulse, label: 'Healthcare Module', desc: 'Patient Cognitive Monitoring', color: 'from-neuro-rose to-neuro-amber' },
  { to: '/investigation', icon: Search, label: 'Investigation Module', desc: 'Stress Indicators', color: 'from-neuro-purple to-neuro-rose' },
  { to: '/emotion', icon: Smile, label: 'Emotion Analysis', desc: 'Multimodal AI Fusion', color: 'from-neuro-amber to-neuro-green' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

interface DashboardStats {
  totalAnalyses: number;
  avgScore: number;
  latestMood: string;
  burnoutRisk: string;
  moodHistory: { date: string; score: number; stress: number; energy: number }[];
  recentScore: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    avgScore: 0,
    latestMood: 'N/A',
    burnoutRisk: 'N/A',
    moodHistory: [],
    recentScore: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [analysisRes, moodRes, sessionRes] = await Promise.all([
        supabase.from('analysis_history').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('mood_history').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('multimodal_sessions').select('neurosphere_score, burnout_risk, mental_state, created_at').order('created_at', { ascending: false }).limit(10),
      ]);

      const analyses = analysisRes.data || [];
      const moods = (moodRes.data || []) as any[];
      const sessions = (sessionRes.data || []) as any[];

      const totalAnalyses = analyses.length + sessions.length;
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((s: number, m: any) => s + (m.neurosphere_score || 0), 0) / sessions.length)
        : analyses.length > 0
          ? Math.round(analyses.reduce((s, a) => s + ((a.results as any)?.focusLevel || 0), 0) / analyses.length)
          : 0;
      const latestMood = moods.length > 0 ? moods[0].mood : (sessions.length > 0 ? sessions[0].mental_state : 'N/A');
      const burnoutRisk = sessions.length > 0 ? sessions[0].burnout_risk : 'N/A';
      const recentScore = sessions.length > 0 ? sessions[0].neurosphere_score : 0;

      // Build mood timeline
      const moodHistory = moods.slice(0, 14).reverse().map((m: any) => ({
        date: new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: m.mood_score,
        stress: m.stress_level,
        energy: m.energy_level,
      }));

      setStats({ totalAnalyses, avgScore, latestMood, burnoutRisk, moodHistory, recentScore });
    } catch { /* ignore */ }
  };

  const burnoutColor = (risk: string) => {
    const map: Record<string, string> = { Low: 'text-neuro-green', Medium: 'text-neuro-amber', High: 'text-neuro-rose', Critical: 'text-destructive', 'N/A': 'text-muted-foreground' };
    return map[risk] || 'text-muted-foreground';
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">NeuroSphere AI</h1>
            <p className="text-xs text-muted-foreground">Multimodal Mental State Analysis Platform</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
          Real-time EEG analysis, facial emotion recognition, voice stress detection, and AI-powered multimodal fusion for comprehensive mental state assessment.
        </p>
      </motion.div>

      {/* Live Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'NeuroSphere Score', value: stats.recentScore > 0 ? `${stats.recentScore}/100` : '—', icon: Brain, gradient: 'from-neuro-cyan/10 to-neuro-blue/10' },
          { label: 'Total Analyses', value: stats.totalAnalyses.toString(), icon: Activity, gradient: 'from-neuro-purple/10 to-neuro-rose/10' },
          { label: 'Avg Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '—', icon: TrendingUp, gradient: 'from-neuro-green/10 to-neuro-cyan/10' },
          { label: 'Latest Mood', value: stats.latestMood || '—', icon: Heart, gradient: 'from-neuro-amber/10 to-neuro-green/10' },
          { label: 'Burnout Risk', value: stats.burnoutRisk || '—', icon: AlertTriangle, gradient: 'from-neuro-rose/10 to-neuro-amber/10', colorClass: burnoutColor(stats.burnoutRisk) },
        ].map((s: any) => (
          <motion.div key={s.label} variants={item} className={`rounded-xl border border-border bg-gradient-to-br ${s.gradient} p-4 hover:border-primary/20 transition-colors`}>
            <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.colorClass || 'text-foreground'}`}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Mood Trend Chart */}
      {stats.moodHistory.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5 mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">Mood & Wellness Trend</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.moodHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} stroke="hsl(220, 14%, 18%)" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} stroke="hsl(220, 14%, 18%)" domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="score" stroke="hsl(168, 80%, 48%)" strokeWidth={2} dot={false} name="Mood" />
                <Line type="monotone" dataKey="stress" stroke="hsl(350, 72%, 55%)" strokeWidth={1.5} dot={false} name="Stress" />
                <Line type="monotone" dataKey="energy" stroke="hsl(38, 92%, 55%)" strokeWidth={1.5} dot={false} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-cyan" /> Mood</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-rose" /> Stress</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-amber" /> Energy</span>
          </div>
        </motion.div>
      )}

      {/* Workflow Steps */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">How It Works</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Capture Input', desc: 'EEG, Camera, or Microphone' },
            { step: '02', label: 'AI Analysis', desc: 'Multimodal fusion engine' },
            { step: '03', label: 'View Results', desc: 'Scores, charts & explainability' },
            { step: '04', label: 'Wellness', desc: 'Meditation, reports & chatbot' },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-4 relative overflow-hidden group hover:border-primary/20 transition-colors">
              <span className="text-3xl font-black text-primary/10 absolute -top-1 -right-1">{s.step}</span>
              <p className="text-xs font-semibold text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modules Grid */}
      <h2 className="text-sm font-semibold text-foreground mb-4">Analysis Modules</h2>
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {modules.map((mod) => (
          <motion.div key={mod.to} variants={item}>
            <Link to={mod.to} className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <mod.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{mod.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open Module <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
        {/* Quick Links */}
        <motion.div variants={item}>
          <Link to="/meditation" className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neuro-purple to-neuro-blue flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Meditation Mode</h3>
            <p className="text-xs text-muted-foreground mt-1">Breathing, relaxation & focus</p>
            <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Start <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Pipeline Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Processing Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {['EEG Signals', 'Face Detection', 'Voice Analysis', 'Feature Fusion', 'Mental State Classification', 'Explainable AI'].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-medium">{s}</span>
              {i < 5 && <ArrowRight className="w-3 h-3 text-primary" />}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
