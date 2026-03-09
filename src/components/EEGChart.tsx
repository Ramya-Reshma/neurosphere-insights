import { EEGData } from '@/lib/eeg-processing';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EEGChartProps {
  data: EEGData;
}

export default function EEGChart({ data }: EEGChartProps) {
  // Generate wave visualization data
  const points = Array.from({ length: 60 }, (_, i) => {
    const t = i / 10;
    return {
      t: i,
      alpha: data.alpha * Math.sin(t * 1.2 + Math.random() * 0.3),
      beta: data.beta * Math.sin(t * 2.5 + Math.random() * 0.4),
      gamma: data.gamma * Math.sin(t * 4 + Math.random() * 0.5),
      theta: data.theta * Math.sin(t * 0.7 + Math.random() * 0.2),
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">EEG Signal Visualization</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <defs>
              <linearGradient id="colorAlpha" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(150, 60%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(150, 60%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorGamma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(260, 60%, 58%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(260, 60%, 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTheta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis dataKey="t" tick={false} stroke="hsl(220, 14%, 18%)" />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} stroke="hsl(220, 14%, 18%)" />
            <Tooltip
              contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: 'hsl(210, 20%, 92%)' }}
            />
            <Area type="monotone" dataKey="alpha" stroke="hsl(150, 60%, 48%)" fill="url(#colorAlpha)" strokeWidth={1.5} name="Alpha" />
            <Area type="monotone" dataKey="beta" stroke="hsl(210, 80%, 55%)" fill="url(#colorBeta)" strokeWidth={1.5} name="Beta" />
            <Area type="monotone" dataKey="gamma" stroke="hsl(260, 60%, 58%)" fill="url(#colorGamma)" strokeWidth={1.5} name="Gamma" />
            <Area type="monotone" dataKey="theta" stroke="hsl(38, 92%, 55%)" fill="url(#colorTheta)" strokeWidth={1.5} name="Theta" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        {[
          { label: 'Alpha', color: 'bg-neuro-green' },
          { label: 'Beta', color: 'bg-neuro-blue' },
          { label: 'Gamma', color: 'bg-neuro-purple' },
          { label: 'Theta', color: 'bg-neuro-amber' },
        ].map(w => (
          <div key={w.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${w.color}`} />
            <span className="text-[10px] text-muted-foreground">{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
