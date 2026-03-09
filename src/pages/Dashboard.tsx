import { motion } from 'framer-motion';
import { Brain, GraduationCap, Building2, HeartPulse, Search, Smile, ArrowRight, Activity, Waves, Cpu, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  { to: '/student', icon: GraduationCap, label: 'Student Module', desc: 'Focus & Stress Analysis for learners', color: 'from-neuro-cyan to-neuro-blue' },
  { to: '/workplace', icon: Building2, label: 'Workplace Module', desc: 'Cognitive Stress Monitoring for employees', color: 'from-neuro-blue to-neuro-purple' },
  { to: '/healthcare', icon: HeartPulse, label: 'Healthcare Module', desc: 'Patient Cognitive Monitoring', color: 'from-neuro-rose to-neuro-amber' },
  { to: '/investigation', icon: Search, label: 'Investigation Module', desc: 'Cognitive Stress Indicators', color: 'from-neuro-purple to-neuro-rose' },
  { to: '/emotion', icon: Smile, label: 'Emotion Analysis', desc: 'Face & Voice Emotion Detection', color: 'from-neuro-amber to-neuro-green' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">NeuroInsight AI</h1>
            <p className="text-xs text-muted-foreground">Cognitive & Emotional Analysis Platform</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 max-w-xl leading-relaxed">
          Advanced EEG signal analysis, facial emotion detection, and voice tone analysis to evaluate cognitive and emotional states across multiple domains.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'Active Modules', value: '5', icon: Activity, gradient: 'from-neuro-cyan/10 to-neuro-blue/10' },
          { label: 'Signal Types', value: '3', icon: Waves, gradient: 'from-neuro-purple/10 to-neuro-rose/10' },
          { label: 'AI Processing', value: '4-Stage', icon: Cpu, gradient: 'from-neuro-amber/10 to-neuro-green/10' },
          { label: 'AI Assistant', value: 'Nila', icon: Users, gradient: 'from-neuro-blue/10 to-neuro-purple/10' },
        ].map((s) => (
          <motion.div key={s.label} variants={item} className={`rounded-xl border border-border bg-gradient-to-br ${s.gradient} p-4 hover:border-primary/20 transition-colors`}>
            <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Workflow Steps */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10">
        <h2 className="text-sm font-semibold text-foreground mb-4">How It Works</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Upload / Connect EEG', desc: 'Manual, CSV, or real-time stream' },
            { step: '02', label: 'Run Analysis', desc: 'AI pipeline processes signals' },
            { step: '03', label: 'View Results', desc: 'Scores, charts & insights' },
            { step: '04', label: 'Ask Nila', desc: 'AI chatbot for guidance' },
          ].map((s, i) => (
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
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <motion.div key={mod.to} variants={item}>
            <Link
              to={mod.to}
              className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
            >
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
      </motion.div>

      {/* Pipeline Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Processing Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {['Raw EEG Signals', 'Noise Cancellation', 'Bandpass Filtering', 'Feature Extraction', 'Classification', 'Interpretation'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-medium">{step}</span>
              {i < 5 && <ArrowRight className="w-3 h-3 text-primary" />}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
