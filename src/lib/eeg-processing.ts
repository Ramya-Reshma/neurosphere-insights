// EEG signal processing utilities (simulated for browser environment)

export interface EEGData {
  alpha: number;
  beta: number;
  gamma: number;
  theta: number;
}

export interface AnalysisResult {
  focusLevel: number;
  stressLevel: string;
  mentalFatigue: string;
  learningReadiness: string;
  cognitiveLoad: string;
  focusStability: string;
  brainActivity: string;
  signalResponse: string;
  cognitiveStressIndicator: string;
  responseStability: string;
  rawScores: {
    focus: number;
    stress: number;
    fatigue: number;
    cognitive: number;
  };
}

export function parseCSVToEEG(csvText: string): EEGData[] {
  const lines = csvText.trim().split('\n');
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('alpha') || header.includes('beta');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  return dataLines.map(line => {
    const values = line.split(',').map(v => parseFloat(v.trim()));
    return {
      alpha: values[0] || 0,
      beta: values[1] || 0,
      gamma: values[2] || 0,
      theta: values[3] || 0,
    };
  }).filter(d => !isNaN(d.alpha));
}

export function analyzeEEG(data: EEGData): AnalysisResult {
  const total = data.alpha + data.beta + data.gamma + data.theta || 1;
  
  // Normalize ratios
  const alphaRatio = data.alpha / total;
  const betaRatio = data.beta / total;
  const gammaRatio = data.gamma / total;
  const thetaRatio = data.theta / total;
  
  // Focus: high beta + gamma = high focus
  const focusScore = Math.min(100, Math.round((betaRatio * 0.5 + gammaRatio * 0.5) * 300));
  
  // Stress: high beta, low alpha = stress
  const stressScore = Math.min(100, Math.round((betaRatio * 0.7 - alphaRatio * 0.3) * 250));
  
  // Fatigue: high theta = fatigue
  const fatigueScore = Math.min(100, Math.round(thetaRatio * 300));
  
  // Cognitive load: gamma activity
  const cognitiveScore = Math.min(100, Math.round(gammaRatio * 350));
  
  const getLevel = (score: number): string => {
    if (score < 30) return 'Low';
    if (score < 60) return 'Moderate';
    return 'High';
  };
  
  const getReadiness = (focus: number, fatigue: number): string => {
    if (focus > 65 && fatigue < 40) return 'Good';
    if (focus > 45 && fatigue < 60) return 'Moderate';
    return 'Needs Improvement';
  };

  return {
    focusLevel: focusScore,
    stressLevel: getLevel(stressScore),
    mentalFatigue: getLevel(fatigueScore),
    learningReadiness: getReadiness(focusScore, fatigueScore),
    cognitiveLoad: getLevel(cognitiveScore),
    focusStability: focusScore > 55 ? 'Stable' : focusScore > 35 ? 'Moderate' : 'Unstable',
    brainActivity: focusScore > 20 ? 'Active' : 'Low but Stable',
    signalResponse: focusScore > 30 ? 'Present' : 'Weak',
    cognitiveStressIndicator: stressScore > 50 ? 'Elevated' : stressScore > 25 ? 'Moderate' : 'Normal',
    responseStability: stressScore > 50 ? 'Low' : stressScore > 25 ? 'Moderate' : 'High',
    rawScores: {
      focus: focusScore,
      stress: Math.max(0, stressScore),
      fatigue: fatigueScore,
      cognitive: cognitiveScore,
    },
  };
}

export function analyzeMultipleEEG(dataSet: EEGData[]): AnalysisResult {
  if (dataSet.length === 0) {
    return analyzeEEG({ alpha: 0, beta: 0, gamma: 0, theta: 0 });
  }
  const avg: EEGData = {
    alpha: dataSet.reduce((s, d) => s + d.alpha, 0) / dataSet.length,
    beta: dataSet.reduce((s, d) => s + d.beta, 0) / dataSet.length,
    gamma: dataSet.reduce((s, d) => s + d.gamma, 0) / dataSet.length,
    theta: dataSet.reduce((s, d) => s + d.theta, 0) / dataSet.length,
  };
  return analyzeEEG(avg);
}

export function getRecommendations(result: AnalysisResult, module: string): string[] {
  const recs: string[] = [];
  
  if (result.rawScores.stress > 50) {
    recs.push('Practice deep breathing exercises for 5 minutes');
    recs.push('Take regular breaks every 25 minutes');
  }
  if (result.rawScores.focus < 50) {
    recs.push('Minimize distractions in the environment');
    recs.push('Try focused attention meditation');
  }
  if (result.rawScores.fatigue > 50) {
    recs.push('Consider a 15-minute power nap');
    recs.push('Stay hydrated and take a short walk');
  }
  
  if (module === 'student') {
    if (result.rawScores.focus < 60) recs.push('Use the Pomodoro technique for studying');
    recs.push('Review material during peak focus hours');
  } else if (module === 'workplace') {
    recs.push('Consider adjusting workload distribution');
    if (result.rawScores.stress > 40) recs.push('Discuss workload with your manager');
  } else if (module === 'healthcare') {
    recs.push('Continue monitoring at regular intervals');
    recs.push('Document any changes in signal patterns');
  } else if (module === 'investigation') {
    recs.push('Note elevated stress markers during specific questions');
    recs.push('Cross-reference with behavioral observations');
  }
  
  return recs.length > 0 ? recs : ['Continue monitoring for baseline assessment'];
}

export function generateSimulatedEEG(): EEGData {
  return {
    alpha: +(8 + Math.random() * 8).toFixed(1),
    beta: +(5 + Math.random() * 15).toFixed(1),
    gamma: +(1 + Math.random() * 8).toFixed(1),
    theta: +(3 + Math.random() * 10).toFixed(1),
  };
}
