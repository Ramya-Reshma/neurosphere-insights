import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function NilaChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm **Nila**, your NeuroInsight AI assistant. 🧠\n\nI can help you understand EEG results, suggest relaxation techniques, and guide you through the system. Ask me anything!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let assistantSoFar = '';

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nila-chat`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to connect to Nila');
      }

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
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: open ? 'none' : 'flex' }}
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 w-[360px] h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gradient-primary">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary-foreground" />
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">Nila</p>
                  <p className="text-[10px] text-primary-foreground/70">AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-primary-foreground/10">
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <ReactMarkdown className="prose prose-xs prose-invert [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && !messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground animate-pulse">Nila is thinking...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border">
              <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Nila anything..."
                  className="flex-1 bg-secondary text-xs h-9"
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
