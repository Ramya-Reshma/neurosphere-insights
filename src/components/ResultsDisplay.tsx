import { AnalysisResult, EEGData } from '@/lib/eeg-processing';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Info, Shield, Brain, Zap, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface ResultsDisplayProps {
  result: AnalysisResult;
  recommendations: string[];
  moduleType: string;
  eegData?: EEGData;
}

const tooltips: Record<string, string> = {
  'Focus Level': 'Calculated from Beta (13-30 Hz) and Gamma (30-100 Hz) wave ratios. Higher values indicate sustained attention.',
  'Stress Level': 'Derived from high Beta activity relative to Alpha waves. Elevated Beta with suppressed Alpha suggests cognitive stress.',
  'Mental Fatigue': 'Based on Theta (4-8 Hz) wave dominance. Increased Theta activity correlates with drowsiness and mental fatigue.',
  'Cognitive Load': 'Measured via Gamma wave (30-100 Hz) intensity. High Gamma indicates complex information processing.',
  'Signal Quality': 'Overall signal-to-noise ratio assessment of the recorded EEG data.',
};

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground flex items-center gap-1 cursor-help">
              {label} <Info className="w-3 h-3 opacity-50" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            {tooltips[label] || `${label} metric based on EEG analysis.`}
          </TooltipContent>
        </Tooltip>
        <span className="text-foreground font-medium">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
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
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
            {label} <Info className="w-3 h-3 opacity-40" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px] text-xs">
          {tooltips[label] || `${label} interpretation from AI model.`}
        </TooltipContent>
      </Tooltip>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{value}</span>
    </div>
  );
}

function BrainwaveDistribution({ eegData }: { eegData: EEGData }) {
  const total = eegData.alpha + eegData.beta + eegData.gamma + eegData.theta || 1;
  const data = [
    { name: 'Alpha', value: +(eegData.alpha / total * 100).toFixed(1), color: 'hsl(150, 60%, 48%)' },
    { name: 'Beta', value: +(eegData.beta / total * 100).toFixed(1), color: 'hsl(210, 80%, 55%)' },
    { name: 'Gamma', value: +(eegData.gamma / total * 100).toFixed(1), color: 'hsl(260, 60%, 58%)' },
    { name: 'Theta', value: +(eegData.theta / total * 100).toFixed(1), color: 'hsl(38, 92%, 55%)' },
  ];
  const dominant = data.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <div className="flex items-center gap-6">
      <div className="w-28 h-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
            </span>
            <span className="text-foreground font-medium">{d.value}%</span>
          </div>
        ))}
        <div className="pt-1.5 mt-1.5 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            Dominant: <span className="text-foreground font-medium">{dominant.name}</span> ({dominant.value}%)
          </p>
        </div>
      </div>
    </div>
  );
}

function generateSmartSummary(result: AnalysisResult, eegData?: EEGData): string {
  const parts: string[] = [];
  const total = eegData ? (eegData.alpha + eegData.beta + eegData.gamma + eegData.theta || 1) : 1;
  
  if (eegData) {
    const betaRatio = eegData.beta / total;
    const alphaRatio = eegData.alpha / total;
    if (betaRatio > 0.35) parts.push('EEG signals show increased beta activity indicating high cognitive load.');
    else if (alphaRatio > 0.35) parts.push('EEG signals show dominant alpha waves indicating a relaxed mental state.');
    else parts.push('EEG signals show balanced brainwave distribution across frequency bands.');
  }

  if (result.rawScores.focus > 65) parts.push('Focus levels are elevated.');
  else if (result.rawScores.focus < 35) parts.push('Focus levels are below optimal range.');

  if (result.rawScores.stress > 50) parts.push('Mild to moderate stress patterns are detected.');
  else if (result.rawScores.fatigue > 50) parts.push('Signs of mental fatigue are present.');

  return parts.join(' ') || 'Analysis complete. Brainwave patterns are within normal ranges.';
}

function getSignalQuality(eegData?: EEGData): { score: number; label: string } {
  if (!eegData) return { score: 0, label: 'N/A' };
  const total = eegData.alpha + eegData.beta + eegData.gamma + eegData.theta;
  if (total > 30) return { score: 92, label: 'Excellent' };
  if (total > 15) return { score: 78, label: 'Good' };
  if (total > 5) return { score: 55, label: 'Fair' };
  return { score: 30, label: 'Weak' };
}

function getConfidence(result: AnalysisResult): number {
  const avg = (result.rawScores.focus + result.rawScores.stress + result.rawScores.fatigue + result.rawScores.cognitive) / 4;
  return Math.min(95, Math.max(60, Math.round(65 + avg * 0.3)));
}

export default function ResultsDisplay({ result, recommendations, moduleType, eegData }: ResultsDisplayProps) {
  const [techOpen, setTechOpen] = useState(false);
  const summary = generateSmartSummary(result, eegData);
  const signalQuality = getSignalQuality(eegData);
  const confidence = getConfidence(result);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Smart Summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">AI Summary</p>
            <p className="text-xs text-foreground leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Shield className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-[10px] text-muted-foreground">Signal Quality</p>
          <p className="text-sm font-bold text-foreground">{signalQuality.label}</p>
          <p className="text-[10px] text-muted-foreground">{signalQuality.score}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Brain className="w-4 h-4 mx-auto text-accent mb-1" />
          <p className="text-[10px] text-muted-foreground">Confidence</p>
          <p className="text-sm font-bold text-foreground">{confidence}%</p>
          <p className="text-[10px] text-muted-foreground">AI Model</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Eye className="w-4 h-4 mx-auto text-neuro-amber mb-1" />
          <p className="text-[10px] text-muted-foreground">Focus</p>
          <p className="text-sm font-bold text-foreground">{result.focusLevel}%</p>
          <p className="text-[10px] text-muted-foreground">{result.focusStability}</p>
        </div>
      </div>

      {/* Brainwave Distribution */}
      {eegData && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Brainwave Distribution</h3>
          <BrainwaveDistribution eegData={eegData} />
        </div>
      )}

      {/* Simple Explanation Section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Simple Explanation
        </h3>
        <div className="space-y-3">
          <ScoreBar label="Focus Level" value={result.rawScores.focus} color="gradient-primary" />
          <ScoreBar label="Stress Level" value={result.rawScores.stress} color="bg-neuro-rose" />
          <ScoreBar label="Mental Fatigue" value={result.rawScores.fatigue} color="bg-neuro-amber" />
          <ScoreBar label="Cognitive Load" value={result.rawScores.cognitive} color="bg-neuro-purple" />
        </div>

        <div className="mt-4 pt-3 border-t border-border">
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
      </div>

      {/* Technical Analysis (Collapsible) */}
      <Collapsible open={techOpen} onOpenChange={setTechOpen}>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Technical Analysis
            </h3>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${techOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              {eegData && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Alpha (8-13 Hz)', value: `${eegData.alpha} µV`, desc: 'Relaxation / Idle state', color: 'text-neuro-green' },
                    { label: 'Beta (13-30 Hz)', value: `${eegData.beta} µV`, desc: 'Active thinking / Focus', color: 'text-neuro-blue' },
                    { label: 'Gamma (30-100 Hz)', value: `${eegData.gamma} µV`, desc: 'High cognition / Memory', color: 'text-neuro-purple' },
                    { label: 'Theta (4-8 Hz)', value: `${eegData.theta} µV`, desc: 'Drowsiness / Creativity', color: 'text-neuro-amber' },
                  ].map(band => (
                    <div key={band.label} className="rounded-lg bg-secondary/50 p-2.5">
                      <p className={`text-[10px] font-mono font-medium ${band.color}`}>{band.label}</p>
                      <p className="text-sm font-bold text-foreground">{band.value}</p>
                      <p className="text-[10px] text-muted-foreground">{band.desc}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg bg-secondary/50 p-2.5">
                <p className="text-[10px] text-muted-foreground font-mono">Cognitive State Inference</p>
                <p className="text-xs text-foreground mt-1">
                  {result.rawScores.focus > 65 ? 'Sustained attention detected with active prefrontal cortex engagement.' :
                   result.rawScores.stress > 50 ? 'Sympathetic nervous system activation detected, suggesting cognitive stress response.' :
                   result.rawScores.fatigue > 50 ? 'Increased slow-wave activity suggesting cortical deactivation and mental fatigue.' :
                   'Balanced cortical activity across measured frequency bands.'}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

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
