const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const normalizeSignalConfidences = (signals = []) => {
  if (!Array.isArray(signals) || !signals.length) return [];

  const ordered = [...signals].sort((a, b) => (b.semanticConfidence ?? b.confidence) - (a.semanticConfidence ?? a.confidence));
  const rawValues = ordered.map((signal) => signal.semanticConfidence ?? signal.confidence ?? 0.2);
  const mean = rawValues.reduce((sum, value) => sum + value, 0) / rawValues.length;
  const variance = rawValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / rawValues.length;
  const spread = clamp(Math.sqrt(variance), 0.06, 0.22);
  const ceiling = clamp(0.86 + Math.min(0.05, spread), 0.82, 0.91);
  const floor = rawValues.length > 5 ? 0.1 : 0.16;

  return signals.map((signal) => {
    const keyConfidence = signal.semanticConfidence ?? signal.confidence;
    const rank = ordered.findIndex((item) => item === signal);
    const rankFactor = ordered.length > 1 ? 1 - rank / (ordered.length - 1) : 1;
    const target = floor + Math.pow(rankFactor, 1.35) * (ceiling - floor);
    const uncertainty = clamp(1 - (signal.occurrences || 1) / 18, 0.08, 0.42);
    const normalized = Number(clamp(target * 0.74 + keyConfidence * 0.2 - uncertainty * 0.06, floor, ceiling).toFixed(2));

    return {
      ...signal,
      confidence: normalized,
      adjustedConfidence: normalized,
      semanticConfidence: normalized
    };
  });
};
