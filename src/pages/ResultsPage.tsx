import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Zap, Eye, Volume2, Activity, Shield, Sparkles, Target, Heart, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { generatePDFReport } from '@/lib/pdf-report';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ResultsPage() {
  const [latestEEG, setLatestEEG] = useState<any>(null);
  const [latestMultimodal, setLatestMultimodal] = useState<any>(null);
  const [moodTrend, setMoodTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => { loadResults(); }, []);

  const loadResults = async () => {
    try {
      const [analysisRes, sessionRes, moodRes] = await Promise.all([
        supabase.from('analysis_history').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('multimodal_sessions').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('mood_history').select('*').order('created_at', { ascending: false }).limit(14),
      ]);
      setLatestEEG(analysisRes.data?.[0] || null);
      setLatestMultimodal(sessionRes.data?.[0] || null);
      setMoodTrend((moodRes.data || []).reverse().map((m: any) => ({
        date: new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        mood: m.mood_score, stress: m.stress_level, energy: m.energy_level, focus: m.focus_level,
      })));
    } catch { /* ignore */ }
    setLoading(false);
  };

  const eegResults = latestEEG?.results as any;
  const eegData = latestEEG?.eeg_data as any;
  const fusion = latestMultimodal?.fusion_result as any;
  const explanation = fusion?.explanation || latestMultimodal?.explainability;

  const brainwaveData = eegData ? (() => {
    const total = (eegData.alpha || 0) + (eegData.beta || 0) + (eegData.gamma || 0) + (eegData.theta || 0) || 1;
    return [
      { name: 'Alpha', value: +((eegData.alpha || 0) / total * 100).toFixed(1), color: 'hsl(162, 62%, 45%)' },
      { name: 'Beta', value: +((eegData.beta || 0) / total * 100).toFixed(1), color: 'hsl(215, 85%, 55%)' },
      { name: 'Gamma', value: +((eegData.gamma || 0) / total * 100).toFixed(1), color: 'hsl(245, 72%, 62%)' },
      { name: 'Theta', value: +((eegData.theta || 0) / total * 100).toFixed(1), color: 'hsl(38, 92%, 55%)' },
    ];
  })() : [];

  const stateProbs = fusion?.state_probabilities || latestMultimodal?.mental_state_scores || {};

  const generateSummary = () => {
    const parts: string[] = [];
    if (eegResults) {
      if (eegResults.rawScores?.focus > 65) parts.push('Neural analysis reveals elevated focus with active prefrontal engagement.');
      else if (eegResults.rawScores?.stress > 50) parts.push('EEG patterns indicate heightened cognitive stress with increased beta-wave activity.');
      else parts.push('Brainwave analysis shows balanced cortical activity across frequency bands.');
    }
    if (fusion) {
      parts.push(`Multimodal fusion predicts ${fusion.mental_state || latestMultimodal?.mental_state || 'balanced'} state with ${fusion.neurosphere_score || latestMultimodal?.neurosphere_score || 0}/100 NeuroSphere score.`);
    }
    if (latestMultimodal?.facial_emotion) parts.push(`Facial analysis detected ${latestMultimodal.facial_emotion} expression.`);
    return parts.length > 0 ? parts.join(' ') : 'No analysis data available yet. Run an analysis from the Modules Workspace.';
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const hasData = latestEEG || latestMultimodal;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center shadow-elevated">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Analysis Results</h1>
              <p className="text-xs text-muted-foreground">Unified output from all modules</p>
            </div>
          </div>
          {hasData && (
            <Button variant="neuro-outline" size="sm" className="rounded-xl" onClick={() => setShowSummary(!showSummary)}>
              <FileText className="w-3 h-3 mr-1" /> {showSummary ? 'Hide' : 'Summarize'}
            </Button>
          )}
        </div>
      </motion.div>

      {!hasData ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Brain className="w-14 h-14 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-foreground font-medium">Awaiting real-time data...</p>
          <p className="text-xs text-muted-foreground mt-1 mb-5">Run an analysis in the Modules Workspace to see results here.</p>
          <Link to="/modules"><Button variant="neuro" className="rounded-xl">Go to Modules</Button></Link>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
          {/* AI Summary */}
          <motion.div variants={item} className="glass-card rounded-2xl border-primary/15 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">AI Analysis Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{generateSummary()}</p>
              </div>
            </div>
          </motion.div>

          {/* Concise summary panel */}
          <AnimatePresence>
            {showSummary && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-5 border-neuro-cyan/20 bg-neuro-cyan/5 overflow-hidden">
                <h3 className="text-xs font-bold text-neuro-cyan uppercase tracking-wide mb-2">Quick Summary</h3>
                <p className="text-xs text-foreground leading-relaxed">
                  {fusion?.mental_state && `Mental State: ${fusion.mental_state}. `}
                  {(fusion?.neurosphere_score || latestMultimodal?.neurosphere_score) && `NeuroSphere Score: ${fusion?.neurosphere_score || latestMultimodal?.neurosphere_score}/100. `}
                  {latestMultimodal?.facial_emotion && `Detected emotion: ${latestMultimodal.facial_emotion}. `}
                  {latestMultimodal?.burnout_risk && `Burnout risk: ${latestMultimodal.burnout_risk}. `}
                  {eegResults?.rawScores?.focus && `Focus: ${eegResults.rawScores.focus}%. `}
                  {eegResults?.rawScores?.stress && `Stress: ${eegResults.rawScores.stress}%.`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Metrics */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'NeuroSphere Score', value: latestMultimodal?.neurosphere_score ? `${latestMultimodal.neurosphere_score}/100` : eegResults ? `${Math.min(95, Math.round(65 + (eegResults.rawScores?.focus || 0) * 0.3))}%` : '—', icon: Brain, color: 'text-neuro-violet' },
              { label: 'Focus Level', value: eegResults?.focusLevel ? `${eegResults.focusLevel}%` : '—', icon: Target, color: 'text-neuro-blue' },
              { label: 'Mental State', value: latestMultimodal?.mental_state || eegResults?.stressLevel || '—', icon: Activity, color: 'text-neuro-cyan' },
              { label: 'Facial Emotion', value: latestMultimodal?.facial_emotion || '—', icon: Eye, color: 'text-neuro-pink' },
              { label: 'Burnout Risk', value: latestMultimodal?.burnout_risk || '—', icon: Shield, color: latestMultimodal?.burnout_risk === 'High' ? 'text-neuro-rose' : 'text-neuro-green' },
            ].map((m) => (
              <div key={m.label} className="metric-card text-center">
                <m.icon className={`w-4 h-4 mx-auto ${m.color} mb-1.5`} />
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className={`text-base font-bold ${m.color} mt-0.5`}>{m.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Brainwave Distribution + State Probabilities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {brainwaveData.length > 0 && (
              <motion.div variants={item} className="chart-glass">
                <h3 className="text-sm font-semibold text-foreground mb-3">Brainwave Distribution</h3>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={brainwaveData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} strokeWidth={0}>
                          {brainwaveData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {brainwaveData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs gap-4">
                        <span className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </span>
                        <span className="text-foreground font-semibold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {Object.keys(stateProbs).length > 0 && (
              <motion.div variants={item} className="chart-glass">
                <h3 className="text-sm font-semibold text-foreground mb-3">Mental State Probabilities</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(stateProbs).map(([key, value]) => ({ name: String(key).charAt(0).toUpperCase() + String(key).slice(1), value: Number(value) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 88%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(225, 14%, 88%)', borderRadius: 12, fontSize: 11 }} />
                      <Bar dataKey="value" fill="hsl(245, 72%, 62%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>

          {/* EEG Signal Details */}
          {eegData && (
            <motion.div variants={item} className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">EEG Signal Data</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Alpha (8-13 Hz)', value: `${eegData.alpha} µV`, desc: 'Relaxation', color: 'text-neuro-green' },
                  { label: 'Beta (13-30 Hz)', value: `${eegData.beta} µV`, desc: 'Focus', color: 'text-neuro-blue' },
                  { label: 'Gamma (30-100 Hz)', value: `${eegData.gamma} µV`, desc: 'High cognition', color: 'text-neuro-violet' },
                  { label: 'Theta (4-8 Hz)', value: `${eegData.theta} µV`, desc: 'Drowsiness', color: 'text-neuro-amber' },
                ].map(b => (
                  <div key={b.label} className="rounded-xl bg-muted/40 p-3">
                    <p className={`text-[10px] font-mono font-semibold ${b.color}`}>{b.label}</p>
                    <p className="text-sm font-bold text-foreground">{b.value}</p>
                    <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cognitive Scores */}
          {eegResults?.rawScores && (
            <motion.div variants={item} className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cognitive Scores</h3>
              <div className="space-y-3">
                {[
                  { label: 'Focus Level', value: eegResults.rawScores.focus, color: 'bg-neuro-violet' },
                  { label: 'Stress Level', value: eegResults.rawScores.stress, color: 'bg-neuro-rose' },
                  { label: 'Mental Fatigue', value: eegResults.rawScores.fatigue, color: 'bg-neuro-amber' },
                  { label: 'Cognitive Load', value: eegResults.rawScores.cognitive, color: 'bg-neuro-cyan' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="text-foreground font-semibold">{s.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${s.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Voice & Facial */}
          {(latestMultimodal?.facial_emotion || latestMultimodal?.voice_emotion) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {latestMultimodal?.facial_emotion && (
                <motion.div variants={item} className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-neuro-pink" /> Facial Emotion
                  </h3>
                  <p className="text-xl font-bold text-foreground">{latestMultimodal.facial_emotion}</p>
                  <p className="text-xs text-muted-foreground">Confidence: {latestMultimodal.facial_confidence}%</p>
                </motion.div>
              )}
              {latestMultimodal?.voice_emotion && (
                <motion.div variants={item} className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-neuro-cyan" /> Voice Stress
                  </h3>
                  <p className="text-xl font-bold text-foreground">{latestMultimodal.voice_emotion}</p>
                  <p className="text-xs text-muted-foreground">Stress Score: {latestMultimodal.voice_stress_score}%</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Explainable AI */}
          {explanation && (
            <motion.div variants={item} className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-neuro-amber" /> Explainable AI — Why this prediction?
              </h3>
              {explanation.reasoning && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{explanation.reasoning}</p>}
              {explanation.primary_factors?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {explanation.primary_factors.map((f: string, i: number) => (
                    <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{f}</span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {explanation.eeg_contribution && (
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[10px] text-neuro-blue font-semibold mb-1">EEG Contribution</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{explanation.eeg_contribution}</p>
                  </div>
                )}
                {explanation.facial_contribution && (
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[10px] text-neuro-green font-semibold mb-1">Facial Contribution</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{explanation.facial_contribution}</p>
                  </div>
                )}
                {explanation.voice_contribution && (
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[10px] text-neuro-violet font-semibold mb-1">Voice Contribution</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{explanation.voice_contribution}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Mood Trend */}
          {moodTrend.length > 1 && (
            <motion.div variants={item} className="chart-glass">
              <h3 className="text-sm font-semibold text-foreground mb-3">Wellness Trends</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 88%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(225, 10%, 48%)' }} stroke="hsl(225, 14%, 88%)" domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(225, 14%, 88%)', borderRadius: 12, fontSize: 11 }} />
                    <Line type="monotone" dataKey="mood" stroke="hsl(245, 72%, 62%)" strokeWidth={2} dot={false} name="Mood" />
                    <Line type="monotone" dataKey="stress" stroke="hsl(350, 72%, 55%)" strokeWidth={1.5} dot={false} name="Stress" />
                    <Line type="monotone" dataKey="energy" stroke="hsl(38, 92%, 55%)" strokeWidth={1.5} dot={false} name="Energy" />
                    <Line type="monotone" dataKey="focus" stroke="hsl(190, 88%, 48%)" strokeWidth={1.5} dot={false} name="Focus" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className="w-3 h-1 rounded-full bg-neuro-violet" /> Mood</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className="w-3 h-1 rounded-full bg-neuro-rose" /> Stress</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className="w-3 h-1 rounded-full bg-neuro-amber" /> Energy</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className="w-3 h-1 rounded-full bg-neuro-cyan" /> Focus</span>
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {(fusion?.recommendations || latestMultimodal?.recommendations || latestEEG?.recommendations) && (
            <motion.div variants={item} className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Recommendations</h3>
              <ul className="space-y-2">
                {(fusion?.recommendations || latestMultimodal?.recommendations || latestEEG?.recommendations || []).map((rec: string, i: number) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span> {rec}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Link to="/modules"><Button variant="neuro" className="rounded-xl">Run New Analysis</Button></Link>
            <Link to="/tracking"><Button variant="neuro-outline" className="rounded-xl">View History <TrendingUp className="w-3 h-3 ml-1" /></Button></Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
