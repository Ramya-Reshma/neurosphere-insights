import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trash2, FileDown, GraduationCap, Building2, HeartPulse, Search, Smile, Clock, Brain, ChevronDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/analysis-storage';
import { generatePDFReport } from '@/lib/pdf-report';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

const moduleIcons: Record<string, any> = {
  student: GraduationCap,
  workplace: Building2,
  healthcare: HeartPulse,
  investigation: Search,
  emotion: Smile,
};

const moduleColors: Record<string, string> = {
  student: 'from-neuro-violet to-neuro-blue',
  workplace: 'from-neuro-blue to-neuro-cyan',
  healthcare: 'from-neuro-rose to-neuro-amber',
  investigation: 'from-neuro-pink to-neuro-violet',
  emotion: 'from-neuro-cyan to-neuro-green',
};

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
    loadTrend();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getAnalysisHistory();
      setHistory(data || []);
    } catch {
      toast.error('Failed to load history');
    }
    setLoading(false);
  };

  const loadTrend = async () => {
    try {
      const { data } = await supabase.from('mood_history').select('mood_score, stress_level, focus_level, created_at').order('created_at', { ascending: true }).limit(30);
      setTrendData((data || []).map((m: any) => ({
        date: new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        mood: m.mood_score,
        stress: m.stress_level,
        focus: m.focus_level,
      })));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysis(id);
      setHistory(h => h.filter(item => item.id !== id));
      toast.success('Analysis deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = (item: any) => {
    generatePDFReport({
      module: item.module_type,
      subjectName: item.subject_name,
      details: item.subject_details || {},
      eegData: item.eeg_data,
      result: item.results,
      recommendations: item.recommendations || [],
      notes: item.notes,
    });
  };

  const filtered = filter === 'all' ? history : history.filter(h => h.module_type === filter);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center glow-primary">
          <TrendingUp className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Analysis Tracking</h1>
          <p className="text-xs text-muted-foreground">Historical sessions timeline & trends</p>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Session Trends
          </h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(240, 8%, 48%)' }} stroke="hsl(240, 10%, 88%)" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(240, 8%, 48%)' }} stroke="hsl(240, 10%, 88%)" domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(240, 10%, 88%)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="mood" stroke="hsl(250, 65%, 58%)" strokeWidth={2} dot={false} name="Mood" />
                <Line type="monotone" dataKey="stress" stroke="hsl(350, 72%, 55%)" strokeWidth={1.5} dot={false} name="Stress" />
                <Line type="monotone" dataKey="focus" stroke="hsl(195, 90%, 48%)" strokeWidth={1.5} dot={false} name="Focus" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-violet rounded" /> Mood</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-rose rounded" /> Stress</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-0.5 bg-neuro-cyan rounded" /> Focus</span>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'student', 'workplace', 'healthcare', 'investigation', 'emotion'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Modules' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Brain className="w-8 h-8 mx-auto text-primary animate-pulse mb-2" />
          <p className="text-xs text-muted-foreground">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border bg-card shadow-card">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">No analyses yet</p>
          <p className="text-xs text-muted-foreground mt-1">Run an analysis in the Modules Workspace to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item) => {
              const Icon = moduleIcons[item.module_type] || Brain;
              const color = moduleColors[item.module_type] || 'from-neuro-violet to-neuro-blue';
              const results = item.results || {};
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Collapsible>
                    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                      <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 hover:bg-muted/30 transition-colors text-left">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.subject_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.module_type.charAt(0).toUpperCase() + item.module_type.slice(1)} • {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">Focus: {results.focusLevel ?? '-'}%</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-1 border-t border-border">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Focus</p>
                              <p className="text-sm font-bold text-foreground">{results.focusLevel ?? '-'}%</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Stress</p>
                              <p className="text-sm font-bold text-foreground">{results.stressLevel ?? '-'}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Signal Quality</p>
                              <p className="text-sm font-bold text-foreground">{item.signal_quality_score}%</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Confidence</p>
                              <p className="text-sm font-bold text-foreground">{item.confidence_percentage}%</p>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mb-3 italic">"{item.notes}"</p>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" variant="neuro" onClick={() => handleExport(item)} className="text-xs">
                              <FileDown className="w-3.5 h-3.5 mr-1" /> Export PDF
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-xs text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
