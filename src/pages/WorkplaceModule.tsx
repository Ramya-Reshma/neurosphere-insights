import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Building2, FileDown } from 'lucide-react';
import EEGInputPanel from '@/components/EEGInputPanel';
import EEGChart from '@/components/EEGChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { EEGData, AnalysisResult, analyzeEEG, getRecommendations } from '@/lib/eeg-processing';
import { generatePDFReport } from '@/lib/pdf-report';

type Step = 'details' | 'signal' | 'results';

export default function WorkplaceModule() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState({ name: '', age: '', department: '', role: '', workHours: '', reason: '' });
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const handleEEGData = (data: EEGData) => {
    setEegData(data);
    const res = analyzeEEG(data);
    setResult(res);
    setRecommendations(getRecommendations(res, 'workplace'));
    setStep('results');
  };

  const handleExportPDF = () => {
    if (!eegData || !result) return;
    generatePDFReport({
      module: 'Workplace Cognitive Stress Monitoring',
      subjectName: details.name,
      details: { Name: details.name, Age: details.age, Department: details.department, Role: details.role, 'Work Hours': details.workHours, 'Assessment Reason': details.reason },
      eegData, result, recommendations,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neuro-blue to-neuro-purple flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Workplace Module</h1>
          <p className="text-xs text-muted-foreground">Cognitive Stress Monitoring</p>
        </div>
      </div>

      {step === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Employee Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-xs text-muted-foreground">Employee Name *</Label><Input value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Age</Label><Input type="number" value={details.age} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Department</Label><Input value={details.department} onChange={e => setDetails(d => ({ ...d, department: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Job Role</Label><Input value={details.role} onChange={e => setDetails(d => ({ ...d, role: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Work Hours</Label><Input value={details.workHours} onChange={e => setDetails(d => ({ ...d, workHours: e.target.value }))} className="mt-1 bg-secondary" placeholder="e.g. 9 AM - 6 PM" /></div>
            <div><Label className="text-xs text-muted-foreground">Assessment Reason</Label><Input value={details.reason} onChange={e => setDetails(d => ({ ...d, reason: e.target.value }))} className="mt-1 bg-secondary" /></div>
          </div>
          <Button onClick={() => details.name && setStep('signal')} variant="neuro" className="mt-5" disabled={!details.name}>Proceed to Signal Collection</Button>
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
          <ResultsDisplay result={result} recommendations={recommendations} moduleType="workplace" />
          <div className="flex gap-3">
            <Button variant="neuro" onClick={handleExportPDF}><FileDown className="w-4 h-4 mr-1" /> Export PDF</Button>
            <Button variant="neuro-outline" onClick={() => { setStep('signal'); setResult(null); }}>New Assessment</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
