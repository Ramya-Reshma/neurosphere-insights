import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeartPulse, FileDown, CheckCircle2 } from 'lucide-react';
import EEGInputPanel from '@/components/EEGInputPanel';
import EEGChart from '@/components/EEGChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { EEGData, AnalysisResult, analyzeEEG, getRecommendations } from '@/lib/eeg-processing';
import { generatePDFReport } from '@/lib/pdf-report';

type Step = 'details' | 'signal' | 'results';
const stepOrder: Step[] = ['details', 'signal', 'results'];
const stepLabels: Record<Step, string> = { details: 'Patient Details', signal: 'Signal Collection', results: 'Results' };
const categories = ['Coma Patient Monitoring', 'Cognitive Disturbance', 'Neurological Observation', 'General Mental Monitoring'];

export default function HealthcareModule() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState({ patientName: '', age: '', gender: '', medicalNotes: '', category: '' });
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const currentIdx = stepOrder.indexOf(step);

  const handleEEGData = (data: EEGData) => {
    setEegData(data);
    const res = analyzeEEG(data);
    setResult(res);
    setRecommendations(getRecommendations(res, 'healthcare'));
    setStep('results');
  };

  const handleExportPDF = () => {
    if (!eegData || !result) return;
    generatePDFReport({
      module: 'Healthcare - Patient Cognitive Monitoring', subjectName: details.patientName,
      details: { Patient: details.patientName, Age: details.age, Gender: details.gender, Category: details.category, 'Medical Notes': details.medicalNotes },
      eegData, result, recommendations,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neuro-rose to-neuro-amber flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Healthcare Module</h1>
          <p className="text-xs text-muted-foreground">Patient Cognitive Monitoring</p>
        </div>
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
            <h3 className="text-sm font-semibold text-foreground mb-4">Patient Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Patient Name *</Label><Input value={details.patientName} onChange={e => setDetails(d => ({ ...d, patientName: e.target.value }))} className="mt-1 bg-secondary" /></div>
              <div><Label className="text-xs text-muted-foreground">Age</Label><Input type="number" value={details.age} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} className="mt-1 bg-secondary" /></div>
              <div>
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <Select value={details.gender} onValueChange={v => setDetails(d => ({ ...d, gender: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category *</Label>
                <Select value={details.category} onValueChange={v => setDetails(d => ({ ...d, category: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Medical Notes</Label>
              <Textarea value={details.medicalNotes} onChange={e => setDetails(d => ({ ...d, medicalNotes: e.target.value }))} className="mt-1 bg-secondary" rows={3} />
            </div>
            <Button onClick={() => details.patientName && details.category && setStep('signal')} variant="neuro" className="mt-5" disabled={!details.patientName || !details.category}>Proceed to Signal Collection</Button>
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
            <ResultsDisplay result={result} recommendations={recommendations} moduleType="healthcare" eegData={eegData} />
            <div className="flex gap-3">
              <Button variant="neuro" onClick={handleExportPDF}><FileDown className="w-4 h-4 mr-1" /> Export Clinical Report</Button>
              <Button variant="neuro-outline" onClick={() => { setStep('signal'); setResult(null); }}>New Assessment</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
