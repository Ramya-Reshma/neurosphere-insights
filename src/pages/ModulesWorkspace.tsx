import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, GraduationCap, Building2, HeartPulse, Search, Smile, Heart, Gamepad2, Microscope, ChevronDown, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import StudentModule from './StudentModule';
import WorkplaceModule from './WorkplaceModule';
import HealthcareModule from './HealthcareModule';
import InvestigationModule from './InvestigationModule';
import EmotionModule from './EmotionModule';
import MeditationPage from './MeditationPage';
import GameModePage from './GameModePage';
import ResearchModule from './ResearchModule';

interface ModuleInfo {
  id: string;
  icon: any;
  label: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  gradient: string;
}

const modules: ModuleInfo[] = [
  {
    id: 'student', icon: GraduationCap, label: 'Student Cognitive Analysis',
    purpose: 'Analyze student focus, cognitive load, and learning engagement.',
    inputs: ['EEG signal input'],
    outputs: ['Focus level', 'Mental fatigue detection', 'Cognitive load analysis', 'Learning engagement score'],
    gradient: 'from-neuro-violet to-neuro-blue',
  },
  {
    id: 'workplace', icon: Building2, label: 'Workplace Cognitive Monitoring',
    purpose: 'Evaluate productivity, stress, and mental performance in workplace environments.',
    inputs: ['EEG signals'],
    outputs: ['Focus index', 'Work stress level', 'Productivity cognitive score'],
    gradient: 'from-neuro-blue to-neuro-cyan',
  },
  {
    id: 'healthcare', icon: HeartPulse, label: 'Healthcare Neural Monitoring',
    purpose: 'Support mental health and neurological monitoring.',
    inputs: ['EEG signals'],
    outputs: ['Cognitive stability', 'Brainwave distribution', 'Mental health indicators'],
    gradient: 'from-neuro-rose to-neuro-amber',
  },
  {
    id: 'investigation', icon: Search, label: 'Investigation & Behavioral Analysis',
    purpose: 'Assist behavioral and psychological evaluation during questioning scenarios.',
    inputs: ['EEG signals', 'Voice patterns'],
    outputs: ['Cognitive stress detection', 'Behavioral response patterns', 'Mental pressure indicators'],
    gradient: 'from-neuro-pink to-neuro-violet',
  },
  {
    id: 'emotion', icon: Smile, label: 'Multimodal Emotion Analysis',
    purpose: 'Real-time emotional detection using camera, voice, and EEG fusion.',
    inputs: ['Live webcam', 'Live microphone', 'EEG data (optional)'],
    outputs: ['Facial emotion detection', 'Voice stress analysis', 'Multimodal AI fusion'],
    gradient: 'from-neuro-cyan to-neuro-green',
  },
  {
    id: 'meditation', icon: Heart, label: 'Meditation & Wellness',
    purpose: 'Guide and analyze meditation sessions with breathing exercises.',
    inputs: ['Session timer'],
    outputs: ['Relaxation score', 'Meditation depth level', 'Mind stability indicator'],
    gradient: 'from-neuro-violet to-neuro-pink',
  },
  {
    id: 'game', icon: Gamepad2, label: 'AI Interactive Lab',
    purpose: 'Research-oriented cognitive interaction games using live camera analysis.',
    inputs: ['Live webcam', 'Real-time interaction'],
    outputs: ['Emotion matching', 'Stress challenge scores', 'Probabilistic analysis'],
    gradient: 'from-neuro-amber to-neuro-green',
  },
  {
    id: 'research', icon: Microscope, label: 'AI Research Module',
    purpose: 'CNN + Transformer cognitive pattern classification from audio spectrograms.',
    inputs: ['Live microphone', 'Audio spectrogram'],
    outputs: ['Pattern classification', 'Feature extraction', 'Cognitive state prediction'],
    gradient: 'from-neuro-purple to-neuro-violet',
  },
];

const ModuleComponent: Record<string, React.ComponentType> = {
  student: StudentModule,
  workplace: WorkplaceModule,
  healthcare: HealthcareModule,
  investigation: InvestigationModule,
  emotion: EmotionModule,
  meditation: MeditationPage,
  game: GameModePage,
  research: ResearchModule,
};

export default function ModulesWorkspace() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const ActiveComp = activeModule ? ModuleComponent[activeModule] : null;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow shadow-elevated">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Modules Workspace</h1>
            <p className="text-xs text-muted-foreground">Select a module to begin analysis</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!activeModule ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {modules.map((mod, idx) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setActiveModule(mod.id)}
                  className="w-full text-left glass-card rounded-2xl p-5 group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <mod.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{mod.label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mod.purpose}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mod.outputs.slice(0, 3).map((o) => (
                          <span key={o} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{o}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:text-primary transition-colors duration-200 flex-shrink-0 mt-1" />
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="module"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveModule(null)}
              className="mb-4 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Workspace
            </Button>

            {ActiveComp && <ActiveComp />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
