import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, FileDown } from 'lucide-react';
import EEGInputPanel from '@/components/EEGInputPanel';
import EEGChart from '@/components/EEGChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { EEGData, AnalysisResult, analyzeEEG, getRecommendations } from '@/lib/eeg-processing';
import { generatePDFReport } from '@/lib/pdf-report';

type Step = 'details' | 'signal' | 'results';

export default function StudentModule() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState({ studentName: '', age: '', gender: '', className: '', school: '', teacherName: '' });
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleDetailsSubmit = () => {
    if (details.studentName && details.age) setStep('signal');
  };

  const handleEEGData = (data: EEGData) => {
    setEegData(data);
    const res = analyzeEEG(data);
    setResult(res);
    setRecommendations(getRecommendations(res, 'student'));
    setStep('results');
  };

  const handleExportPDF = () => {
    if (!eegData || !result) return;
    generatePDFReport({
      module: 'Student Focus & Stress Analysis',
      subjectName: details.studentName,
      details: { 'Student Name': details.studentName, Age: details.age, Gender: details.gender, Class: details.className, School: details.school, Teacher: details.teacherName, Date: new Date().toLocaleDateString() },
      eegData, result, recommendations, notes,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neuro-cyan to-neuro-blue flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Student Module</h1>
          <p className="text-xs text-muted-foreground">Focus & Stress Analysis</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {(['details', 'signal', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s || (['signal', 'results'].indexOf(step) >= i) ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</div>
            <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{s}</span>
            {i < 2 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Student Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-xs text-muted-foreground">Student Name *</Label><Input value={details.studentName} onChange={e => setDetails(d => ({ ...d, studentName: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Age *</Label><Input type="number" value={details.age} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div>
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <Select value={details.gender} onValueChange={v => setDetails(d => ({ ...d, gender: v }))}>
                <SelectTrigger className="mt-1 bg-secondary"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs text-muted-foreground">Class</Label><Input value={details.className} onChange={e => setDetails(d => ({ ...d, className: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">School</Label><Input value={details.school} onChange={e => setDetails(d => ({ ...d, school: e.target.value }))} className="mt-1 bg-secondary" /></div>
            <div><Label className="text-xs text-muted-foreground">Teacher Name</Label><Input value={details.teacherName} onChange={e => setDetails(d => ({ ...d, teacherName: e.target.value }))} className="mt-1 bg-secondary" /></div>
          </div>
          <Button onClick={handleDetailsSubmit} variant="neuro" className="mt-5" disabled={!details.studentName || !details.age}>Proceed to Signal Collection</Button>
        </motion.div>
      )}

      {step === 'signal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <EEGInputPanel onDataReady={handleEEGData} />
          <Button variant="ghost" className="mt-3 text-xs" onClick={() => setStep('details')}>← Back to Details</Button>
        </motion.div>
      )}

      {step === 'results' && result && eegData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <EEGChart data={eegData} />
          <ResultsDisplay result={result} recommendations={recommendations} moduleType="student" />
          <div className="rounded-xl border border-border bg-card p-5">
            <Label className="text-xs text-muted-foreground">Teacher Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add observations..." className="mt-2 bg-secondary" rows={3} />
          </div>
          <div className="flex gap-3">
            <Button variant="neuro" onClick={handleExportPDF}><FileDown className="w-4 h-4 mr-1" /> Export PDF Report</Button>
            <Button variant="neuro-outline" onClick={() => { setStep('signal'); setResult(null); }}>New Assessment</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
