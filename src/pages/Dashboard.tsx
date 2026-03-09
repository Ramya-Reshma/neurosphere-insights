import { motion } from 'framer-motion';
import { Brain, GraduationCap, Building2, HeartPulse, Search, Smile, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  { to: '/student', icon: GraduationCap, label: 'Student Module', desc: 'Focus & Stress Analysis for learners', color: 'from-neuro-cyan to-neuro-blue' },
  { to: '/workplace', icon: Building2, label: 'Workplace Module', desc: 'Cognitive Stress Monitoring for employees', color: 'from-neuro-blue to-neuro-purple' },
  { to: '/healthcare', icon: HeartPulse, label: 'Healthcare Module', desc: 'Patient Cognitive Monitoring', color: 'from-neuro-rose to-neuro-amber' },
  { to: '/investigation', icon: Search, label: 'Investigation Module', desc: 'Cognitive Stress Indicators', color: 'from-neuro-purple to-neuro-rose' },
  { to: '/emotion', icon: Smile, label: 'Emotion Analysis', desc: 'Face & Voice Emotion Detection', color: 'from-neuro-amber to-neuro-green' },
];

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">NeuroInsight AI</h1>
            <p className="text-xs text-muted-foreground">Cognitive & Emotional Analysis Platform</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 max-w-xl">
          Advanced EEG signal analysis, facial emotion detection, and voice tone analysis to evaluate cognitive and emotional states across multiple domains.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Modules', value: '5', icon: Activity },
          { label: 'Signal Types', value: '3', icon: Brain },
          { label: 'Input Modes', value: 'EEG / CSV / RT', icon: Brain },
          { label: 'AI Assistant', value: 'Nila', icon: Smile },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Modules Grid */}
      <h2 className="text-sm font-semibold text-foreground mb-4">Analysis Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
          >
            <Link
              to={mod.to}
              className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3`}>
                <mod.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{mod.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open Module <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 rounded-xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Processing Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {['Raw EEG Signals', 'Noise Cancellation', 'Bandpass Filtering', 'Feature Extraction', 'Classification', 'Interpretation'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">{step}</span>
              {i < 5 && <ArrowRight className="w-3 h-3 text-primary" />}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
