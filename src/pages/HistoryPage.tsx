import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, FileDown, GraduationCap, Building2, HeartPulse, Search, Smile, Clock, Brain, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/analysis-storage';
import { generatePDFReport } from '@/lib/pdf-report';
import { toast } from 'sonner';

const moduleIcons: Record<string, any> = {
  student: GraduationCap,
  workplace: Building2,
  healthcare: HeartPulse,
  investigation: Search,
  emotion: Smile,
};

const moduleColors: Record<string, string> = {
  student: 'from-neuro-cyan to-neuro-blue',
  workplace: 'from-neuro-blue to-neuro-purple',
  healthcare: 'from-neuro-rose to-neuro-amber',
  investigation: 'from-neuro-purple to-neuro-rose',
  emotion: 'from-neuro-amber to-neuro-green',
};

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getAnalysisHistory();
      setHistory(data || []);
    } catch (e: any) {
      toast.error('Failed to load history');
    }
    setLoading(false);
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <History className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Analysis History</h1>
          <p className="text-xs text-muted-foreground">View and manage past analyses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'student', 'workplace', 'healthcare', 'investigation', 'emotion'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Modules' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Brain className="w-8 h-8 mx-auto text-muted-foreground animate-pulse mb-2" />
          <p className="text-xs text-muted-foreground">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border bg-card">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No analyses yet</p>
          <p className="text-xs text-muted-foreground mt-1">Run an analysis in any module to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item) => {
              const Icon = moduleIcons[item.module_type] || Brain;
              const color = moduleColors[item.module_type] || 'from-neuro-cyan to-neuro-blue';
              const results = item.results || {};
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Collapsible>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 hover:bg-secondary/30 transition-colors text-left">
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
                            <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Focus</p>
                              <p className="text-sm font-bold text-foreground">{results.focusLevel ?? '-'}%</p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Stress</p>
                              <p className="text-sm font-bold text-foreground">{results.stressLevel ?? '-'}</p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Signal Quality</p>
                              <p className="text-sm font-bold text-foreground">{item.signal_quality_score}%</p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
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
