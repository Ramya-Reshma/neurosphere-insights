import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Moon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickSuggestions = [
  { label: '🧘 Reduce stress', msg: 'What are quick techniques to reduce my stress right now?' },
  { label: '🎯 Improve focus', msg: 'How can I improve my focus and concentration?' },
  { label: '🧠 Explain EEG', msg: 'Explain what my EEG brainwave results mean in simple terms' },
  { label: '😴 Better sleep', msg: 'Give me tips for better sleep to reduce mental fatigue' },
  { label: '⚡ Burnout help', msg: 'I think I might be burning out. What should I do?' },
  { label: '💆 Breathing exercise', msg: 'Guide me through a quick breathing exercise' },
];

export default function NilaChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm **Nila** 🌙\n\nYour AI mental wellness assistant. I can explain analysis results, provide coping strategies, guide breathing exercises, and support your mental health journey. What can I help with?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Fetch recent analysis context
    let context = '';
    try {
      const [sessionRes, moodRes] = await Promise.all([
        supabase.from('multimodal_sessions').select('mental_state, neurosphere_score, burnout_risk, recommendations, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('mood_history').select('mood, mood_score, stress_level, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      const sessions = (sessionRes.data || []) as any[];
      const moods = (moodRes.data || []) as any[];
      if (sessions.length > 0 || moods.length > 0) {
        context = `\n\nUser's recent analysis context:\nSessions: ${JSON.stringify(sessions)}\nMood history: ${JSON.stringify(moods)}`;
      }
    } catch { /* non-critical */ }

    let assistantSoFar = '';

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nila-chat`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          context,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error('Rate limited. Please try again shortly.');
        if (resp.status === 402) throw new Error('AI credits exhausted. Please add credits in settings.');
        throw new Error(err.error || 'Connection failed');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > newMessages.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: e.message || "I'm having trouble connecting. Please try again." }]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-elevated"
        whileHover={{ scale: 1.1, boxShadow: '0 0 24px hsl(250 65% 58% / 0.4)' }}
        whileTap={{ scale: 0.95 }}
        style={{ display: open ? 'none' : 'flex' }}
      >
        <Moon className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 w-[380px] h-[560px] rounded-2xl border border-border bg-card shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Moon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">Nila <Sparkles className="w-3 h-3 text-neuro-amber" /></p>
                  <p className="text-[10px] text-muted-foreground">AI Therapy Assistant • Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <div className="prose prose-xs [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                      ))}
                    </span>
                    Nila is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {quickSuggestions.map(s => (
                  <button
                    key={s.label}
                    onClick={() => send(s.msg)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-muted hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-border">
              <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Nila anything..."
                  className="flex-1 bg-muted text-xs h-9"
                  disabled={loading}
                />
                <Button type="submit" variant="neuro" size="icon" className="h-9 w-9" disabled={loading || !input.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
