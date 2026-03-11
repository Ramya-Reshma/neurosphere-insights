
-- Mood history tracking
CREATE TABLE public.mood_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood TEXT NOT NULL,
  mood_score INTEGER NOT NULL DEFAULT 50,
  energy_level INTEGER NOT NULL DEFAULT 50,
  stress_level INTEGER NOT NULL DEFAULT 50,
  focus_level INTEGER NOT NULL DEFAULT 50,
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moods" ON public.mood_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own moods" ON public.mood_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own moods" ON public.mood_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Multimodal analysis sessions
CREATE TABLE public.multimodal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'multimodal',
  eeg_data JSONB DEFAULT '{}',
  facial_emotion TEXT,
  facial_confidence NUMERIC DEFAULT 0,
  facial_details JSONB DEFAULT '{}',
  voice_stress_score NUMERIC DEFAULT 0,
  voice_emotion TEXT,
  voice_features JSONB DEFAULT '{}',
  fusion_result JSONB DEFAULT '{}',
  mental_state TEXT,
  mental_state_scores JSONB DEFAULT '{}',
  neurosphere_score INTEGER DEFAULT 0,
  burnout_risk TEXT DEFAULT 'low',
  explainability JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.multimodal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.multimodal_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.multimodal_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.multimodal_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for mood tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_history;
