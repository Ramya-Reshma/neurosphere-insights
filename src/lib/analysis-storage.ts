import { supabase } from '@/integrations/supabase/client';
import { EEGData, AnalysisResult } from '@/lib/eeg-processing';

interface SaveAnalysisParams {
  moduleType: string;
  subjectName: string;
  subjectDetails: Record<string, string>;
  eegData: EEGData;
  result: AnalysisResult;
  recommendations: string[];
  notes?: string;
}

export async function saveAnalysis(params: SaveAnalysisParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const total = params.eegData.alpha + params.eegData.beta + params.eegData.gamma + params.eegData.theta;
  const signalQuality = total > 30 ? 92 : total > 15 ? 78 : total > 5 ? 55 : 30;
  const avg = (params.result.rawScores.focus + params.result.rawScores.stress + params.result.rawScores.fatigue + params.result.rawScores.cognitive) / 4;
  const confidence = Math.min(95, Math.max(60, Math.round(65 + avg * 0.3)));

  const { error } = await supabase.from('analysis_history').insert({
    user_id: user.id,
    module_type: params.moduleType,
    subject_name: params.subjectName,
    subject_details: params.subjectDetails,
    eeg_data: params.eegData as any,
    results: params.result as any,
    recommendations: params.recommendations,
    notes: params.notes || '',
    signal_quality_score: signalQuality,
    confidence_percentage: confidence,
  });

  if (error) throw error;
}

export async function getAnalysisHistory() {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase.from('analysis_history').delete().eq('id', id);
  if (error) throw error;
}
