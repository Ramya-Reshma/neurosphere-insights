import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const stages = [
  { id: 'clean', label: 'Signal Cleaning', desc: 'Removing noise & artifacts' },
  { id: 'filter', label: 'Bandpass Filtering', desc: 'Isolating frequency bands' },
  { id: 'extract', label: 'Feature Extraction', desc: 'Alpha, Beta, Gamma, Theta' },
  { id: 'classify', label: 'AI Classification', desc: 'Neural network inference' },
];

interface AnalysisPipelineProps {
  running: boolean;
  onComplete: () => void;
}

export default function AnalysisPipeline({ running, onComplete }: AnalysisPipelineProps) {
  const [currentStage, setCurrentStage] = useState(-1);

  useEffect(() => {
    if (!running) { setCurrentStage(-1); return; }
    let stage = 0;
    setCurrentStage(0);
    const interval = setInterval(() => {
      stage++;
      if (stage >= stages.length) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
        return;
      }
      setCurrentStage(stage);
    }, 700);
    return () => clearInterval(interval);
  }, [running, onComplete]);

  if (!running && currentStage === -1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">Processing Pipeline</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const isDone = i < currentStage;
          const isActive = i === currentStage;
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isDone || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stage.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
              </div>
              {isDone && (
                <span className="text-[10px] text-primary font-medium">Complete</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Overall progress bar */}
      <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
