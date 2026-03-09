import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, FileDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import EEGInputPanel from '@/components/EEGInputPanel';
import EEGChart from '@/components/EEGChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { EEGData, AnalysisResult, analyzeEEG, getRecommendations } from '@/lib/eeg-processing';
import { generatePDFReport } from '@/lib/pdf-report';
import { saveAnalysis } from '@/lib/analysis-storage';
import { toast } from 'sonner';

type Step = 'details' | 'signal' | 'results';
const stepOrder: Step[] = ['details', 'signal', 'results'];
const stepLabels: Record<Step, string> = { details: 'Subject Details', signal: 'Signal Collection', results: 'Results' };

export default function InvestigationModule() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState({ subjectName: '', age: '', caseId: '', questionCategory: '' });
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const currentIdx = stepOrder.indexOf(step);

  const handleEEGData = async (data: EEGData) => {
    setEegData(data);
    const res = analyzeEEG(data);
    setResult(res);
    const recs = getRecommendations(res, 'investigation');
    setRecommendations(recs);
    setStep('results');
    try {
      await saveAnalysis({
        moduleType: 'investigation', subjectName: details.subjectName,
        subjectDetails: { Subject: details.subjectName, Age: details.age, 'Case ID': details.caseId, 'Question Category': details.questionCategory },
        eegData: data, result: res, recommendations: recs,
      });
      toast.success('Analysis saved to history');
    } catch {}
  };

  const handleExportPDF = () => {
    if (!eegData || !result) return;
    generatePDFReport({
      module: 'Investigation - Cognitive Stress Indicator', subjectName: details.subjectName,
      details: { Subject: details.subjectName, Age: details.age, 'Case ID': details.caseId, 'Question Category': details.questionCategory },
      eegData, result, recommendations,
      notes: 'DISCLAIMER: Results are probabilistic cognitive stress indicators, not definitive truth detection.',
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neuro-purple to-neuro-rose flex items-center justify-center">
          <Search className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Investigation Module</h1>
          <p className="text-xs text-muted-foreground">Cognitive Stress Indicator</p>
        </div>
      </div>

      <div className="rounded-lg border border-neuro-amber/30 bg-neuro-amber/5 p-3 mb-6 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-neuro-amber flex-shrink-0 mt-0.5" />
        <p className="text-xs text-neuro-amber">Results are probabilistic cognitive stress indicators, not definitive truth detection. Use as supplementary data only.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${i < currentIdx ? 'bg-primary text-primary-foreground' : i === currentIdx ? 'gradient-primary text-primary-foreground glow-primary' : 'bg-secondary text-muted-foreground'}`}>
              {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">{stepLabels[s]}</span>
            {i < 2 && <div className={`flex-1 h-px ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Subject Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Subject Name *</Label><Input value={details.subjectName} onChange={e => setDetails(d => ({ ...d, subjectName: e.target.value }))} className="mt-1 bg-secondary" /></div>
              <div><Label className="text-xs text-muted-foreground">Age</Label><Input type="number" value={details.age} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} className="mt-1 bg-secondary" /></div>
              <div><Label className="text-xs text-muted-foreground">Case ID *</Label><Input value={details.caseId} onChange={e => setDetails(d => ({ ...d, caseId: e.target.value }))} className="mt-1 bg-secondary" /></div>
              <div><Label className="text-xs text-muted-foreground">Question Category</Label><Input value={details.questionCategory} onChange={e => setDetails(d => ({ ...d, questionCategory: e.target.value }))} className="mt-1 bg-secondary" /></div>
            </div>
            <Button onClick={() => details.subjectName && details.caseId && setStep('signal')} variant="neuro" className="mt-5" disabled={!details.subjectName || !details.caseId}>Proceed to Signal Collection</Button>
          </motion.div>
        )}

        {step === 'signal' && (
          <motion.div key="signal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <EEGInputPanel onDataReady={handleEEGData} />
            <Button variant="ghost" className="mt-3 text-xs" onClick={() => setStep('details')}>← Back</Button>
          </motion.div>
        )}

        {step === 'results' && result && eegData && (
          <motion.div key="results" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
            <EEGChart data={eegData} />
            <ResultsDisplay result={result} recommendations={recommendations} moduleType="investigation" eegData={eegData} />
            <div className="flex gap-3">
              <Button variant="neuro" onClick={handleExportPDF}><FileDown className="w-4 h-4 mr-1" /> Export Report</Button>
              <Button variant="neuro-outline" onClick={() => { setStep('signal'); setResult(null); }}>New Assessment</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
