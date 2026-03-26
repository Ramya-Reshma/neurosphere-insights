import React, { useRef, useEffect } from 'react';

interface Props {
  alpha: number; // 0-1
  beta: number;  // 0-1
  gamma: number; // 0-1
  active: boolean;
}

export default function LiveBrainwave({ alpha, beta, gamma, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      tRef.current += 0.03;
      const t = tRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = 'hsl(225, 20%, 96%)';
      ctx.fillRect(0, 0, w, h);

      const drawWave = (yOffset: number, amplitude: number, freq: number, color: string, jag: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < w; x++) {
          const noise = jag > 0.3 ? (Math.random() - 0.5) * jag * 8 : 0;
          const y = yOffset + Math.sin(x * freq * 0.02 + t * 3) * amplitude * 15 + noise;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      if (active) {
        drawWave(h * 0.2, alpha, 1.5, 'hsl(162, 62%, 45%)', 0);       // Alpha - smooth
        drawWave(h * 0.5, beta, 3, 'hsl(215, 85%, 55%)', beta * 0.3); // Beta - moderate
        drawWave(h * 0.8, gamma, 6, 'hsl(350, 72%, 55%)', gamma);     // Gamma - jagged when stressed
      } else {
        // Flat line
        [0.2, 0.5, 0.8].forEach((y, i) => {
          ctx.beginPath();
          ctx.strokeStyle = `hsl(225, 14%, ${82 + i * 3}%)`;
          ctx.lineWidth = 1;
          ctx.moveTo(0, h * y);
          ctx.lineTo(w, h * y);
          ctx.stroke();
        });
      }

      // Labels
      if (active) {
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = 'hsl(162, 62%, 45%)';
        ctx.fillText(`α ${(alpha * 100).toFixed(0)}%`, 4, h * 0.2 - 8);
        ctx.fillStyle = 'hsl(215, 85%, 55%)';
        ctx.fillText(`β ${(beta * 100).toFixed(0)}%`, 4, h * 0.5 - 8);
        ctx.fillStyle = 'hsl(350, 72%, 55%)';
        ctx.fillText(`γ ${(gamma * 100).toFixed(0)}%`, 4, h * 0.8 - 8);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [alpha, beta, gamma, active]);

  return (
    <canvas ref={canvasRef} width={400} height={120} className="w-full h-28 rounded-xl" />
  );
}
