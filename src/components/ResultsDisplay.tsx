import { AnalysisResult } from '@/lib/eeg-processing';
import { motion } from 'framer-motion';

interface ResultsDisplayProps {
  result: AnalysisResult;
  recommendations: string[];
  moduleType: string;
}

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function LevelBadge({ label, value }: { label: string; value: string }) {
  const colorMap: Record<string, string> = {
    'Low': 'bg-neuro-green/15 text-neuro-green',
    'Moderate': 'bg-neuro-amber/15 text-neuro-amber',
    'High': 'bg-neuro-rose/15 text-neuro-rose',
    'Good': 'bg-neuro-green/15 text-neuro-green',
    'Stable': 'bg-neuro-green/15 text-neuro-green',
    'Unstable': 'bg-neuro-rose/15 text-neuro-rose',
    'Active': 'bg-neuro-cyan/15 text-neuro-cyan',
    'Present': 'bg-neuro-green/15 text-neuro-green',
    'Weak': 'bg-neuro-amber/15 text-neuro-amber',
    'Elevated': 'bg-neuro-rose/15 text-neuro-rose',
    'Normal': 'bg-neuro-green/15 text-neuro-green',
    'Needs Improvement': 'bg-neuro-amber/15 text-neuro-amber',
  };
  const cls = colorMap[value] || 'bg-secondary text-secondary-foreground';
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{value}</span>
    </div>
  );
}

export default function ResultsDisplay({ result, recommendations, moduleType }: ResultsDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Scores */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Analysis Scores</h3>
        <div className="space-y-3">
          <ScoreBar label="Focus Level" value={result.rawScores.focus} color="gradient-primary" />
          <ScoreBar label="Stress Level" value={result.rawScores.stress} color="bg-neuro-rose" />
          <ScoreBar label="Mental Fatigue" value={result.rawScores.fatigue} color="bg-neuro-amber" />
          <ScoreBar label="Cognitive Load" value={result.rawScores.cognitive} color="bg-neuro-purple" />
        </div>
      </div>

      {/* Levels */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Interpretation</h3>
        <LevelBadge label="Stress Level" value={result.stressLevel} />
        <LevelBadge label="Mental Fatigue" value={result.mentalFatigue} />
        <LevelBadge label="Focus Stability" value={result.focusStability} />
        {moduleType === 'student' && <LevelBadge label="Learning Readiness" value={result.learningReadiness} />}
        {moduleType === 'workplace' && <LevelBadge label="Cognitive Load" value={result.cognitiveLoad} />}
        {moduleType === 'healthcare' && (
          <>
            <LevelBadge label="Brain Activity" value={result.brainActivity} />
            <LevelBadge label="Signal Response" value={result.signalResponse} />
          </>
        )}
        {moduleType === 'investigation' && (
          <>
            <LevelBadge label="Cognitive Stress" value={result.cognitiveStressIndicator} />
            <LevelBadge label="Response Stability" value={result.responseStability} />
          </>
        )}
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recommendations</h3>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
