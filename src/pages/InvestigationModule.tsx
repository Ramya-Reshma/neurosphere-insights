import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, FileDown, AlertTriangle } from 'lucide-react';
import EEGInputPanel from '@/components/EEGInputPanel';
import EEGChart from '@/components/EEGChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { EEGData, AnalysisResult, analyzeEEG, getRecommendations } from '@/lib/eeg-processing';
import { generatePDFReport } from '@/lib/pdf-report';

type Step = 'details' | 'signal' | 'results';

export default function InvestigationModule() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState({ subjectName: '', age: '', caseId: '', questionCategory: '' });
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const handleEEGData = (data: EEGData) => {
    setEegData(data);
    const res = analyzeEEG(data);
    setResult(res);
    setRecommendations(getRecommendations(res, 'investigation'));
    setStep('results');
  };

  const handleExportPDF = () => {
    if (!eegData || !result) return;
    generatePDFReport({
      module: 'Investigation - Cognitive Stress Indicator',
      subjectName: details.subjectName,
      details: { Subject: details.subjectName, Age: details.age, 'Case ID': details.caseId, 'Question Category': details.questionCategory },
      eegData, result, recommendations,
      notes: 'DISCLAIMER: Results are probabilistic cognitive stress indicators, not definitive truth detection. These should be used as supplementary data alongside other investigative methods.',
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neuro-purple to-neuro-rose flex items-center justify-center">
          <Search className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Investigation Module</h1>
          <p className="text-xs text-muted-foreground">Cognitive Stress Indicator</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-neuro-amber/30 bg-neuro-amber/5 p-3 mb-6 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-neuro-amber flex-shrink-0 mt-0.5" />
        <p className="text-xs text-neuro-amber">Results are probabilistic cognitive stress indicators, not definitive truth detection. Use as supplementary data only.</p>
      </div>

      {step === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <EEGInputPanel onDataReady={handleEEGData} />
          <Button variant="ghost" className="mt-3 text-xs" onClick={() => setStep('details')}>← Back</Button>
        </motion.div>
      )}

      {step === 'results' && result && eegData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <EEGChart data={eegData} />
          <ResultsDisplay result={result} recommendations={recommendations} moduleType="investigation" />
          <div className="flex gap-3">
            <Button variant="neuro" onClick={handleExportPDF}><FileDown className="w-4 h-4 mr-1" /> Export Report</Button>
            <Button variant="neuro-outline" onClick={() => { setStep('signal'); setResult(null); }}>New Assessment</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
