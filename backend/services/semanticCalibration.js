import { THEME_DOMAINS } from './themeAggregator.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getThemeShare = (themeSummary, key) => {
  return themeSummary?.themeDominance?.find((item) => item.key === key)?.share || 0;
};

const calculateSuppressionFactor = (signal, dominantDomainKey, themeSummary) => {
  const signalDomain = THEME_DOMAINS[signal.category] || 'miscellaneous';
  const signalShare = getThemeShare(themeSummary, signal.category);

  if (dominantDomainKey === 'legal' && signalDomain === 'privacy') {
    return signalShare < 0.08 ? 0.18 : signalShare < 0.18 ? 0.34 : 0.72;
  }
  if (dominantDomainKey === 'privacy' && signalDomain === 'legal') {
    return themeSummary.dominantDomain?.share > 0.55 ? 0.42 : 0.76;
  }
  if (dominantDomainKey === 'research' && signalDomain === 'legal') {
    return 0.74;
  }
  if (dominantDomainKey === 'financial' && ['legal', 'privacy'].includes(signalDomain)) {
    const signalShare = getThemeShare(themeSummary, signal.category);
    return signalShare < 0.08 ? 0.36 : 0.68;
  }
  if (signal.category === 'advertising' && dominantDomainKey === 'legal') {
    return 0.26;
  }
  return 1.0;
};

const getSectionRelevance = (signal) => {
  return clamp(0.18 + (signal.sectionWeight || 0) * 0.74, 0.16, 0.98);
};

const getDomainInfluence = (signal, themeSummary) => {
  const domain = THEME_DOMAINS[signal.category] || 'miscellaneous';
  const domainEntry = (themeSummary.domainDominance || []).find((entry) => entry.key === domain);
  return clamp(domainEntry?.share ?? 0.12, 0.12, 0.98);
};

const getLocalMatch = (signal) => {
  const occurrences = signal.occurrences || 0;
  return clamp(0.12 + Math.log1p(occurrences) / Math.log(24), 0.12, 0.98);
};

export const calibrateSemanticSignals = (signals = [], themeSummary = {}) => {
  const dominantDomainKey = themeSummary.dominantDomain?.key || null;

  return signals.map((signal) => {
    const baseConfidence = signal.confidence || 0.2;
    const localMatch = getLocalMatch(signal);
    const sectionRelevance = getSectionRelevance(signal);
    const domainInfluence = getDomainInfluence(signal, themeSummary);
    const suppressionFactor = calculateSuppressionFactor(signal, dominantDomainKey, themeSummary);

    const semanticConfidence = Number(
      clamp((localMatch * 0.34 + sectionRelevance * 0.26 + domainInfluence * 0.24 + baseConfidence * 0.16) * suppressionFactor, 0.08, 0.9).toFixed(2)
    );

    const semanticWeight = Number(
      clamp((signal.contextualWeight || 0.2) * (0.42 + domainInfluence * 0.34 + sectionRelevance * 0.18) * suppressionFactor, 0.08, 0.96).toFixed(2)
    );

    const suppressed = signal.suppressed || (semanticConfidence < 0.2 && semanticWeight < 0.2);

    return {
      ...signal,
      semanticConfidence,
      contextualWeight: semanticWeight,
      semanticDomain: THEME_DOMAINS[signal.category] || 'miscellaneous',
      localMatch,
      sectionRelevance,
      domainInfluence,
      suppressionFactor,
      suppressed,
      suppressionReason: suppressed
        ? 'This signal is low-confidence and not central to the document\'s dominant legal or privacy domain.'
        : null
    };
  });
};
