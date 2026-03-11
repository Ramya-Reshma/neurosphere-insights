import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wind, Timer, Play, Pause, RotateCcw, Moon, Heart, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ExerciseType = 'breathing' | 'relaxation' | 'focus';

const exercises: Record<ExerciseType, { name: string; icon: any; steps: { label: string; duration: number }[]; description: string }> = {
  breathing: {
    name: 'Box Breathing',
    icon: Wind,
    description: 'A calming 4-4-4-4 breathing pattern used by Navy SEALs to reduce stress.',
    steps: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Breathe Out', duration: 4 },
      { label: 'Hold', duration: 4 },
    ],
  },
  relaxation: {
    name: 'Progressive Relaxation',
    icon: Moon,
    description: 'Guided muscle tension-release cycle to release physical stress.',
    steps: [
      { label: 'Tense your shoulders', duration: 5 },
      { label: 'Release and relax', duration: 8 },
      { label: 'Tense your hands', duration: 5 },
      { label: 'Release and relax', duration: 8 },
      { label: 'Tense your face', duration: 5 },
      { label: 'Release completely', duration: 10 },
    ],
  },
  focus: {
    name: 'Focus Reset',
    icon: Brain,
    description: 'A quick attention reset using alternating focus points.',
    steps: [
      { label: 'Close your eyes', duration: 3 },
      { label: 'Focus on your breathing', duration: 8 },
      { label: 'Count backwards from 10', duration: 10 },
      { label: 'Slowly open your eyes', duration: 3 },
      { label: 'Focus on one object near you', duration: 6 },
    ],
  },
};

export default function MeditationPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('breathing');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycles, setCycles] = useState(0);

  const exercise = exercises[selectedExercise];

  const startExercise = useCallback(() => {
    setIsRunning(true);
    setCurrentStep(0);
    setCycles(0);
    setTimeLeft(exercise.steps[0].duration);
  }, [exercise]);

  const stopExercise = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setTimeLeft(0);
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next step
          setCurrentStep(step => {
            const next = step + 1;
            if (next >= exercise.steps.length) {
              setCycles(c => c + 1);
              setTimeLeft(exercise.steps[0].duration);
              return 0;
            }
            setTimeLeft(exercise.steps[next].duration);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, exercise]);

  const progress = isRunning
    ? ((exercise.steps[currentStep].duration - timeLeft) / exercise.steps[currentStep].duration) * 100
    : 0;

  // Circle breathing visual
  const breathScale = isRunning
    ? exercise.steps[currentStep]?.label.includes('In') ? 1 + (progress / 100) * 0.4
      : exercise.steps[currentStep]?.label.includes('Out') ? 1.4 - (progress / 100) * 0.4
      : 1.2
    : 1;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neuro-purple to-neuro-blue flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Meditation & Wellness</h1>
          <p className="text-xs text-muted-foreground">Breathing exercises, relaxation & focus reset</p>
        </div>
      </div>

      {/* Exercise Selection */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(exercises) as [ExerciseType, typeof exercises[ExerciseType]][]).map(([key, ex]) => (
          <button
            key={key}
            onClick={() => { stopExercise(); setSelectedExercise(key); }}
            className={`rounded-xl border p-4 text-left transition-all ${
              selectedExercise === key
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-primary/20'
            }`}
          >
            <ex.icon className={`w-5 h-5 mb-2 ${selectedExercise === key ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-semibold text-foreground">{ex.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{ex.description}</p>
          </button>
        ))}
      </div>

      {/* Exercise UI */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center">
          {/* Breathing circle */}
          <motion.div
            animate={{ scale: breathScale }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-40 h-40 rounded-full flex items-center justify-center mb-8 relative"
            style={{
              background: isRunning
                ? `conic-gradient(hsl(168, 80%, 48%) ${progress}%, hsl(220, 16%, 16%) ${progress}%)`
                : 'hsl(220, 16%, 16%)',
            }}
          >
            <div className="w-36 h-36 rounded-full bg-card flex flex-col items-center justify-center">
              {isRunning ? (
                <>
                  <p className="text-3xl font-bold text-foreground">{timeLeft}</p>
                  <p className="text-[10px] text-muted-foreground">seconds</p>
                </>
              ) : (
                <>
                  <exercise.icon className="w-8 h-8 text-primary mb-1" />
                  <p className="text-[10px] text-muted-foreground">Ready</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Current instruction */}
          {isRunning && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <p className="text-lg font-semibold text-foreground">{exercise.steps[currentStep].label}</p>
              <p className="text-xs text-muted-foreground mt-1">Cycle {cycles + 1} • Step {currentStep + 1}/{exercise.steps.length}</p>
            </motion.div>
          )}

          {/* Steps indicator */}
          <div className="flex gap-2 mb-6">
            {exercise.steps.map((s, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < currentStep ? 'bg-primary' : i === currentStep && isRunning ? 'bg-primary animate-pulse' : 'bg-secondary'
              }`} />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {isRunning ? (
              <>
                <Button variant="destructive" size="sm" onClick={stopExercise}>
                  <Pause className="w-4 h-4 mr-1" /> Stop
                </Button>
                <Button variant="ghost" size="sm" onClick={startExercise}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Restart
                </Button>
              </>
            ) : (
              <Button variant="neuro" size="sm" onClick={startExercise} className="px-8">
                <Play className="w-4 h-4 mr-1" /> Start {exercise.name}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tips for better results</h3>
        <ul className="space-y-2">
          <li className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span> Find a quiet, comfortable space</li>
          <li className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span> Sit upright with your back supported</li>
          <li className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span> Practice consistently for 5-10 minutes daily</li>
          <li className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span> Use after high-stress analysis sessions</li>
        </ul>
      </div>
    </div>
  );
}
