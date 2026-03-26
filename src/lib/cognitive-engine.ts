// Real-time cognitive computation engine
// All formulas dynamically computed from live inputs — NO static/mock data

export interface SensorInputs {
  faceEmotion?: string;
  faceConfidence?: number;
  voiceEnergy?: number;       // RMS energy 0-100
  voiceSentiment?: string;    // Positive / Negative / Neutral
  voiceStressScore?: number;  // 0-100
  eegAlpha?: number;
  eegBeta?: number;
  eegGamma?: number;
  eegTheta?: number;
}

export interface CognitiveMetrics {
  cognitiveLoad: number;       // 0-100
  stressIndex: 'LOW' | 'MEDIUM' | 'HIGH';
  emotionalStability: number;  // 0-100
  focusScore: number;          // 0-100
}

export interface ContextOutput {
  label: string;
  value: number | string;
  color: string;
}

const EMOTION_SCORES: Record<string, number> = {
  Happy: 15, Calm: 10, Neutral: 30, Surprise: 45,
  Sad: 60, Fear: 70, Anxious: 75, Angry: 80,
  Stressed: 85, Disgust: 65, Contempt: 55, Fatigued: 50,
};

const SENTIMENT_SCORES: Record<string, number> = {
  Positive: 15, Neutral: 40, Negative: 75,
};

// Track emotion history for stability variance
let emotionHistory: number[] = [];

export function computeCognitiveMetrics(inputs: SensorInputs): CognitiveMetrics {
  const E = EMOTION_SCORES[inputs.faceEmotion || ''] ?? 50;
  const V = inputs.voiceEnergy ?? 50;
  const S = SENTIMENT_SCORES[inputs.voiceSentiment || ''] ?? 40;

  // Cognitive Load = (0.5 × V) + (0.3 × E) + (0.2 × S)
  const cognitiveLoad = Math.round(Math.min(100, Math.max(0, 0.5 * V + 0.3 * E + 0.2 * S)));

  // Stress Index
  const isNegativeEmotion = ['Sad', 'Angry', 'Fear', 'Stressed', 'Anxious', 'Disgust'].includes(inputs.faceEmotion || '');
  const isHighVoice = V > 60;
  let stressIndex: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (isNegativeEmotion && isHighVoice) stressIndex = 'HIGH';
  else if (isNegativeEmotion || isHighVoice || (inputs.voiceStressScore ?? 0) > 60) stressIndex = 'MEDIUM';

  // Track emotion for stability
  emotionHistory.push(E);
  if (emotionHistory.length > 20) emotionHistory = emotionHistory.slice(-20);

  // Emotional Stability = 100 - variance(E over time)
  const mean = emotionHistory.reduce((a, b) => a + b, 0) / emotionHistory.length;
  const variance = emotionHistory.reduce((s, v) => s + (v - mean) ** 2, 0) / emotionHistory.length;
  const emotionalStability = Math.round(Math.max(0, Math.min(100, 100 - variance)));

  // Focus Score = 100 - Cognitive Load
  const focusScore = Math.round(Math.max(0, 100 - cognitiveLoad));

  return { cognitiveLoad, stressIndex, emotionalStability, focusScore };
}

export function resetEmotionHistory() {
  emotionHistory = [];
}

// Context-specific interpretation engine
export function getStudentContext(metrics: CognitiveMetrics): ContextOutput[] {
  return [
    { label: 'Focus Level', value: metrics.focusScore, color: 'neuro-blue' },
    { label: 'Interest', value: metrics.focusScore > 60 ? 'High' : metrics.focusScore > 35 ? 'Moderate' : 'Low', color: 'neuro-cyan' },
    { label: 'Enthusiasm', value: metrics.emotionalStability > 60 ? 'Engaged' : 'Distracted', color: 'neuro-green' },
    { label: 'Learning Efficiency', value: Math.round((metrics.focusScore * 0.6 + metrics.emotionalStability * 0.4)), color: 'neuro-violet' },
  ];
}

export function getWorkplaceContext(metrics: CognitiveMetrics): ContextOutput[] {
  return [
    { label: 'Work Pressure', value: metrics.stressIndex, color: metrics.stressIndex === 'HIGH' ? 'neuro-rose' : 'neuro-amber' },
    { label: 'Productivity Score', value: Math.round(metrics.focusScore * 0.7 + metrics.emotionalStability * 0.3), color: 'neuro-blue' },
    { label: 'Cognitive Fatigue', value: metrics.cognitiveLoad > 70 ? 'High' : metrics.cognitiveLoad > 40 ? 'Moderate' : 'Low', color: 'neuro-amber' },
  ];
}

export function getHealthcareContext(metrics: CognitiveMetrics): ContextOutput[] {
  return [
    { label: 'Emotional Stability', value: metrics.emotionalStability, color: 'neuro-green' },
    { label: 'Brain Support Level', value: metrics.focusScore > 50 ? 'Adequate' : 'Needs Attention', color: 'neuro-cyan' },
    { label: 'Mental Risk Indicator', value: metrics.stressIndex === 'HIGH' ? 'Elevated' : 'Normal', color: metrics.stressIndex === 'HIGH' ? 'neuro-rose' : 'neuro-green' },
  ];
}

export function getInvestigationContext(metrics: CognitiveMetrics): ContextOutput[] {
  // Probabilistic only — scientific disclaimer required
  const lieProbability = Math.min(95, Math.max(5, Math.round(metrics.cognitiveLoad * 0.4 + (100 - metrics.emotionalStability) * 0.3 + (metrics.stressIndex === 'HIGH' ? 25 : metrics.stressIndex === 'MEDIUM' ? 12 : 0))));
  return [
    { label: 'Lie Probability (est.)', value: `${lieProbability}%`, color: 'neuro-rose' },
    { label: 'Pressure Level', value: metrics.stressIndex, color: 'neuro-amber' },
    { label: 'Cognitive Conflict', value: metrics.cognitiveLoad > 65 ? 'Detected' : 'Low', color: 'neuro-violet' },
    { label: 'Mind State', value: metrics.stressIndex === 'HIGH' ? 'Distressed' : metrics.focusScore > 60 ? 'Composed' : 'Uncertain', color: 'neuro-blue' },
  ];
}

// EEG-style waveform generation from real audio data
export function generateBrainwaveFromAudio(voiceEnergy: number, stressIndex: string): { alpha: number; beta: number; gamma: number } {
  // Calm → smooth alpha, Stress → jagged beta/gamma
  const baseAlpha = Math.max(0.1, 1 - voiceEnergy / 100);
  const baseBeta = voiceEnergy / 100;
  const baseGamma = stressIndex === 'HIGH' ? 0.8 : stressIndex === 'MEDIUM' ? 0.4 : 0.15;
  return { alpha: baseAlpha, beta: baseBeta, gamma: baseGamma };
}
