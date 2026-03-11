import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, imageBase64, audioFeatures, eegData, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let messages: any[] = [];

    if (type === "facial") {
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "No image provided. Please enable your webcam." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        {
          role: "system",
          content: `You are an expert emotion recognition AI. Analyze the facial expression in the image and return ONLY a valid JSON object with these exact fields:
{
  "emotion": "one of: Happy, Sad, Angry, Fear, Neutral, Surprise, Disgust, Contempt",
  "confidence": number between 0 and 100,
  "valence": number between -1 and 1 (negative to positive),
  "arousal": number between 0 and 1 (calm to excited),
  "details": {
    "eyebrows": "description",
    "eyes": "description", 
    "mouth": "description",
    "overall": "description"
  },
  "secondary_emotion": "second most likely emotion or null",
  "secondary_confidence": number or 0
}
Do NOT include any markdown, explanation, or text outside the JSON.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze the facial expression in this image. Return only JSON." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ];
    } else if (type === "voice") {
      if (!audioFeatures) {
        return new Response(JSON.stringify({ error: "No audio features provided. Please enable your microphone." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        {
          role: "system",
          content: `You are an expert voice stress and emotion analysis AI. Given audio feature data, analyze and return ONLY a valid JSON object:
{
  "emotion": "one of: Happy, Sad, Angry, Stressed, Calm, Anxious, Neutral",
  "stress_score": number 0-100,
  "confidence": number 0-100,
  "features_analysis": {
    "pitch_assessment": "description of pitch patterns",
    "energy_assessment": "description of energy levels",
    "rate_assessment": "description of speech rate",
    "tone_assessment": "overall tone description"
  },
  "indicators": ["list", "of", "key", "indicators"]
}
Do NOT include any markdown, explanation, or text outside the JSON.`,
        },
        {
          role: "user",
          content: `Analyze these voice features: ${JSON.stringify(audioFeatures)}. Return only JSON.`,
        },
      ];
    } else if (type === "fusion") {
      messages = [
        {
          role: "system",
          content: `You are a multimodal mental state analysis AI. Given EEG, facial, and voice analysis data, perform fusion analysis. Return ONLY valid JSON:
{
  "mental_state": "one of: Calm, Focused, Stressed, Fatigued, Anxious",
  "state_probabilities": {
    "calm": number 0-100,
    "focused": number 0-100,
    "stressed": number 0-100,
    "fatigued": number 0-100,
    "anxious": number 0-100
  },
  "neurosphere_score": number 0-100,
  "burnout_risk": "one of: Low, Medium, High, Critical",
  "explanation": {
    "primary_factors": ["list of key factors"],
    "eeg_contribution": "how EEG data influenced the result",
    "facial_contribution": "how facial analysis influenced the result",
    "voice_contribution": "how voice analysis influenced the result",
    "reasoning": "2-3 sentence explanation"
  },
  "recommendations": ["list of 3-5 actionable recommendations"],
  "mood_label": "simple mood word",
  "energy_level": number 0-100,
  "alert_level": "none, mild, moderate, severe"
}
Do NOT include any markdown or text outside the JSON.`,
        },
        {
          role: "user",
          content: `Perform multimodal mental state fusion analysis on this data:

EEG Data: ${JSON.stringify(eegData || {})}
Facial Analysis: ${JSON.stringify(history?.facial || {})}
Voice Analysis: ${JSON.stringify(history?.voice || {})}

Historical context (recent sessions): ${JSON.stringify(history?.recent || [])}

Return only JSON.`,
        },
      ];
    } else if (type === "report") {
      messages = [
        {
          role: "system",
          content: `You are a mental health report generation AI. Given multimodal analysis data, generate a comprehensive but concise report. Return ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary",
  "mental_state_assessment": "detailed assessment paragraph",
  "eeg_insights": "EEG specific insights",
  "emotion_insights": "facial emotion insights",
  "voice_insights": "voice stress insights",
  "risk_factors": ["list of identified risk factors"],
  "positive_indicators": ["list of positive signs"],
  "recommendations": ["5-7 personalized recommendations"],
  "wellness_plan": "brief daily wellness suggestion",
  "follow_up": "when to re-assess"
}
Do NOT include any markdown or text outside the JSON.`,
        },
        {
          role: "user",
          content: `Generate a mental health report from this analysis data: ${JSON.stringify(history || {})}. Return only JSON.`,
        },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Invalid analysis type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = type === "facial" ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("analyze-multimodal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
