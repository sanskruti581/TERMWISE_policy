const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const privacyCategories = new Set(['privacy', 'advertising']);
const legalCategories = new Set([
  'commercial',
  'payment',
  'liability',
  'indemnification',
  'termination',
  'confidentiality',
  'export',
  'governingLaw',
  'disputeResolution',
  'intellectualProperty',
  'forceMajeure',
  'delivery',
  'compliance',
  'operational'
]);
const financialCategories = new Set(['repayment', 'mortgage', 'penalties', 'loanServicing', 'creditDisclosure', 'collectionRecovery']);

const isPrivacySignal = (signal) => {
  return privacyCategories.has(signal.category) || /privacy|data protection|cookies|tracking|consent|personal data/i.test(String(signal.label || ''));
};

const isConfidentialitySignal = (signal) => {
  return signal.category === 'confidentiality' || /confidentiality|non[-\s]?disclosure|confidential information/i.test(String(signal.label || ''));
};

const calculateDominance = (signal, categoryTotals, totalWeighted, themeDominance) => {
  const clusterShare = clamp((categoryTotals[signal.category] || 0) / Math.max(totalWeighted, 1), 0, 1);
  const baseConfidence = signal.semanticConfidence ?? signal.confidence;
  const themeBoost = (() => {
    if (!Array.isArray(themeDominance)) return 0;
    const theme = themeDominance.find((entry) => entry.key === signal.category || entry.label.toLowerCase().includes(signal.category.toLowerCase()));
    return theme ? theme.share * 0.28 : 0;
  })();

  return Number(clamp(0.14 + clusterShare * 0.52 + baseConfidence * 0.2 + themeBoost, 0, 1).toFixed(2));
};

const findThemeShare = (themeDominance, key) => {
  if (!Array.isArray(themeDominance)) return 0;
  return themeDominance.find((entry) => entry.key === key)?.share || 0;
};

const calculateDomainShare = (themeDominance, categories) => {
  if (!Array.isArray(themeDominance)) return 0;
  return themeDominance.reduce((sum, entry) => {
    return categories.has(entry.key) ? sum + entry.share : sum;
  }, 0);
};

export const balanceContextSignals = (signals, sections = [], themeDominance = [], documentType) => {
  const privacyThemeShare = themeDominance.find((item) => item.key === 'privacy')?.share || 0;
  const legalThemeShare = calculateDomainShare(themeDominance, legalCategories);
  const financialThemeShare = calculateDomainShare(themeDominance, financialCategories);
  const researchThemeShare = themeDominance.find((item) => item.key === 'researchFunding')?.share || 0;
  const dominantTheme = [...themeDominance].sort((a, b) => b.share - a.share)[0];
  const dominantDomain = financialThemeShare >= Math.max(legalThemeShare, privacyThemeShare, researchThemeShare)
    ? 'financial'
    : legalThemeShare >= Math.max(privacyThemeShare, researchThemeShare)
      ? 'legal'
      : privacyThemeShare >= researchThemeShare
        ? 'privacy'
        : 'research';

  const adjusted = signals.map((signal) => {
    const isPrivacy = isPrivacySignal(signal);
    const isConfidentiality = isConfidentialitySignal(signal);
    const weakPrivacySupport = isPrivacy && privacyThemeShare < 0.16 && legalThemeShare >= 0.45;
    const themeShare = findThemeShare(themeDominance, signal.category);
    const localMatch = clamp((signal.occurrences || 1) / Math.max(10, (signal.occurrences || 1) + 6), 0.08, 0.96);
    const sectionWeight = clamp(0.18 + (signal.sectionWeight || 0) * 0.78, 0.16, 0.98);
    const domainDominance = signal.semanticDomain === dominantDomain || (dominantDomain === 'legal' && legalCategories.has(signal.category)) || (dominantDomain === 'financial' && financialCategories.has(signal.category))
      ? clamp(0.72 + (dominantTheme?.share || 0.25) * 0.35, 0.72, 1)
      : clamp(0.2 + themeShare * 1.35, 0.12, 0.78);
    const privacyAdjustment = isPrivacy
      ? weakPrivacySupport
        ? 0.22
        : privacyThemeShare < 0.22
        ? 0.66
        : 1.0
      : 1.0;
    const confidentialityAdjustment = isConfidentiality && legalThemeShare >= 0.4 && privacyThemeShare < 0.3 ? 0.84 : 1.0;
    const suppressionFactor = privacyAdjustment * confidentialityAdjustment;
    const proportionalInfluence = clamp(localMatch * sectionWeight * domainDominance * suppressionFactor, 0.04, 0.98);
    const baseConfidence = signal.semanticConfidence ?? signal.confidence;
    const adjustedConfidence = Number(clamp(baseConfidence * 0.68 + proportionalInfluence * 0.32, 0.06, 0.9).toFixed(2));
    const adjustedWeight = Number(clamp((signal.contextualWeight || 0.2) * 0.58 + proportionalInfluence * 0.42, 0.06, 0.96).toFixed(2));

    return {
      ...signal,
      adjustedConfidence,
      adjustedWeight,
      sectionWeight: signal.sectionWeight || 0,
      localMatch,
      domainDominance,
      suppressionFactor,
      proportionalInfluence,
      suppressed: (weakPrivacySupport && adjustedConfidence < 0.3) || (['legal', 'financial'].includes(dominantDomain) && isPrivacy && privacyThemeShare < 0.08),
      suppressionReason:
        (weakPrivacySupport && adjustedConfidence < 0.3) || (['legal', 'financial'].includes(dominantDomain) && isPrivacy && privacyThemeShare < 0.08)
          ? `Privacy references were suppressed because they represent ${Math.round(privacyThemeShare * 100)}% of semantic influence inside a dominant ${dominantDomain} document.`
          : signal.suppressionReason || null
    };
  });

  const totalWeighted = adjusted.reduce((sum, signal) => sum + signal.adjustedConfidence * signal.occurrences, 0) || 1;
  const categoryTotals = adjusted.reduce((totals, signal) => {
    totals[signal.category] = (totals[signal.category] || 0) + signal.adjustedConfidence * signal.occurrences;
    return totals;
  }, {});

  const rankedSignals = adjusted
    .map((signal) => ({
      ...signal,
      dominance: calculateDominance(signal, categoryTotals, totalWeighted, themeDominance),
      clusterShare: Number(clamp((categoryTotals[signal.category] || 0) / totalWeighted, 0, 1).toFixed(2))
    }))
    .filter((signal) => !signal.suppressed)
    .sort((a, b) => b.dominance - a.dominance || b.adjustedConfidence - a.adjustedConfidence || b.occurrences - a.occurrences);

  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, value]) => ({ category, share: Number(clamp(value / totalWeighted, 0, 1).toFixed(2)) }))
    .sort((a, b) => b.share - a.share);

  return {
    signals: rankedSignals,
    dominantCategory: sortedCategories[0]?.category || null,
    categoryDominance: Object.fromEntries(sortedCategories.map((item) => [item.category, item.share])),
    themes: rankedSignals.map((signal) => signal.category).filter((value, index, array) => value && array.indexOf(value) === index).slice(0, 6),
    totalSignals: rankedSignals.length
  };
};
