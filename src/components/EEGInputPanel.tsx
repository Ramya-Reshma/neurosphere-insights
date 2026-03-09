import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Keyboard, Radio, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { EEGData, parseCSVToEEG, generateSimulatedEEG } from '@/lib/eeg-processing';

interface EEGInputPanelProps {
  onDataReady: (data: EEGData) => void;
}

export default function EEGInputPanel({ onDataReady }: EEGInputPanelProps) {
  const [alpha, setAlpha] = useState('');
  const [beta, setBeta] = useState('');
  const [gamma, setGamma] = useState('');
  const [theta, setTheta] = useState('');
  const [csvStatus, setCsvStatus] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleManualSubmit = () => {
    onDataReady({
      alpha: parseFloat(alpha) || 0,
      beta: parseFloat(beta) || 0,
      gamma: parseFloat(gamma) || 0,
      theta: parseFloat(theta) || 0,
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const dataSet = parseCSVToEEG(text);
      if (dataSet.length > 0) {
        const avg: EEGData = {
          alpha: +(dataSet.reduce((s, d) => s + d.alpha, 0) / dataSet.length).toFixed(2),
          beta: +(dataSet.reduce((s, d) => s + d.beta, 0) / dataSet.length).toFixed(2),
          gamma: +(dataSet.reduce((s, d) => s + d.gamma, 0) / dataSet.length).toFixed(2),
          theta: +(dataSet.reduce((s, d) => s + d.theta, 0) / dataSet.length).toFixed(2),
        };
        setCsvStatus(`Processed ${dataSet.length} samples`);
        onDataReady(avg);
      } else {
        setCsvStatus('No valid data found in CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleStream = () => {
    if (streaming) {
      setStreaming(false);
      return;
    }
    setStreaming(true);
    // Simulate real-time streaming
    const sim = generateSimulatedEEG();
    onDataReady(sim);
    setAlpha(sim.alpha.toString());
    setBeta(sim.beta.toString());
    setGamma(sim.gamma.toString());
    setTheta(sim.theta.toString());
    setTimeout(() => setStreaming(false), 1000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">EEG Signal Input</h3>
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="w-full bg-secondary mb-4">
          <TabsTrigger value="manual" className="flex-1 gap-2 text-xs">
            <Keyboard className="w-3.5 h-3.5" /> Manual
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex-1 gap-2 text-xs">
            <Upload className="w-3.5 h-3.5" /> CSV Upload
          </TabsTrigger>
          <TabsTrigger value="stream" className="flex-1 gap-2 text-xs">
            <Radio className="w-3.5 h-3.5" /> Real-time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Alpha (µV)', value: alpha, set: setAlpha, color: 'text-neuro-green' },
              { label: 'Beta (µV)', value: beta, set: setBeta, color: 'text-neuro-blue' },
              { label: 'Gamma (µV)', value: gamma, set: setGamma, color: 'text-neuro-purple' },
              { label: 'Theta (µV)', value: theta, set: setTheta, color: 'text-neuro-amber' },
            ].map(f => (
              <div key={f.label}>
                <Label className={`text-xs ${f.color}`}>{f.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder="0.0"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleManualSubmit} variant="neuro" className="w-full mt-4" size="sm">
            Analyze Signals
          </Button>
        </TabsContent>

        <TabsContent value="csv">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground mb-3">Upload CSV with alpha, beta, gamma, theta columns</p>
            <Input type="file" accept=".csv" onChange={handleCSVUpload} className="max-w-xs mx-auto" />
            {csvStatus && <p className="text-xs text-primary mt-2">{csvStatus}</p>}
          </div>
        </TabsContent>

        <TabsContent value="stream">
          <div className="text-center py-4">
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${streaming ? 'gradient-primary animate-pulse' : 'bg-secondary'}`}>
              <Radio className={`w-6 h-6 ${streaming ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {streaming ? 'Receiving EEG signals...' : 'Connect EEG headband to begin'}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mb-4 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" /> Simulated mode — no hardware detected
            </p>
            <Button onClick={handleStream} variant={streaming ? 'destructive' : 'neuro'} size="sm">
              {streaming ? 'Stop Streaming' : 'Start Simulation'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
