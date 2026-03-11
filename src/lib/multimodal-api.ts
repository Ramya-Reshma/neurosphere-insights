import { supabase } from '@/integrations/supabase/client';
import { VoiceFeatures } from './voice-analysis';
import { EEGData } from './eeg-processing';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-multimodal`;

async function callAnalysis(body: any) {
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Analysis failed (${resp.status})`);
  }

  return resp.json();
}

export interface FacialResult {
  emotion: string;
  confidence: number;
  valence: number;
  arousal: number;
  details: Record<string, string>;
  secondary_emotion?: string;
  secondary_confidence?: number;
}

export interface VoiceResult {
  emotion: string;
  stress_score: number;
  confidence: number;
  features_analysis: Record<string, string>;
  indicators: string[];
}

export interface FusionResult {
  mental_state: string;
  state_probabilities: Record<string, number>;
  neurosphere_score: number;
  burnout_risk: string;
  explanation: {
    primary_factors: string[];
    eeg_contribution: string;
    facial_contribution: string;
    voice_contribution: string;
    reasoning: string;
  };
  recommendations: string[];
  mood_label: string;
  energy_level: number;
  alert_level: string;
}

export interface ReportResult {
  summary: string;
  mental_state_assessment: string;
  eeg_insights: string;
  emotion_insights: string;
  voice_insights: string;
  risk_factors: string[];
  positive_indicators: string[];
  recommendations: string[];
  wellness_plan: string;
  follow_up: string;
}

export async function analyzeFacialEmotion(imageBase64: string): Promise<FacialResult> {
  return callAnalysis({ type: 'facial', imageBase64 });
}

export async function analyzeVoiceStress(audioFeatures: VoiceFeatures): Promise<VoiceResult> {
  return callAnalysis({ type: 'voice', audioFeatures });
}

export async function performFusion(
  eegData: EEGData | null,
  facialResult: FacialResult | null,
  voiceResult: VoiceResult | null
): Promise<FusionResult> {
  // Get recent sessions for burnout context
  const { data: recent } = await supabase
    .from('multimodal_sessions')
    .select('mental_state, neurosphere_score, burnout_risk, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return callAnalysis({
    type: 'fusion',
    eegData,
    history: {
      facial: facialResult,
      voice: voiceResult,
      recent: recent || [],
    },
  });
}

export async function generateReport(sessionData: any): Promise<ReportResult> {
  return callAnalysis({ type: 'report', history: sessionData });
}

export async function saveMultimodalSession(params: {
  eegData?: EEGData;
  facialResult?: FacialResult;
  voiceResult?: VoiceResult;
  fusionResult?: FusionResult;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('multimodal_sessions').insert({
    user_id: user.id,
    eeg_data: (params.eegData || {}) as any,
    facial_emotion: params.facialResult?.emotion,
    facial_confidence: params.facialResult?.confidence || 0,
    facial_details: (params.facialResult?.details || {}) as any,
    voice_stress_score: params.voiceResult?.stress_score || 0,
    voice_emotion: params.voiceResult?.emotion,
    voice_features: (params.voiceResult?.features_analysis || {}) as any,
    fusion_result: (params.fusionResult || {}) as any,
    mental_state: params.fusionResult?.mental_state,
    mental_state_scores: (params.fusionResult?.state_probabilities || {}) as any,
    neurosphere_score: params.fusionResult?.neurosphere_score || 0,
    burnout_risk: params.fusionResult?.burnout_risk || 'low',
    explainability: (params.fusionResult?.explanation || {}) as any,
    recommendations: params.fusionResult?.recommendations || [],
  } as any);

  if (error) throw error;
}

export async function saveMoodEntry(mood: string, scores: {
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  focusLevel: number;
}, source = 'auto') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('mood_history').insert({
    user_id: user.id,
    mood,
    mood_score: scores.moodScore,
    energy_level: scores.energyLevel,
    stress_level: scores.stressLevel,
    focus_level: scores.focusLevel,
    source,
  } as any);

  if (error) throw error;
}
