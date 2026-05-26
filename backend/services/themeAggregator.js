const THEME_LABELS = {
  commercial: 'Commercial obligations',
  payment: 'Payment obligations',
  repayment: 'Repayment obligations',
  mortgage: 'Mortgage/security',
  penalties: 'Penal charges/default',
  loanServicing: 'Loan servicing',
  creditDisclosure: 'Credit bureau disclosure',
  collectionRecovery: 'Collection/recovery',
  liability: 'Warranty/liability',
  indemnification: 'Indemnification',
  termination: 'Termination conditions',
  confidentiality: 'Confidentiality clauses',
  privacy: 'Privacy references',
  export: 'Export restrictions',
  governingLaw: 'Governing law',
  disputeResolution: 'Dispute resolution',
  intellectualProperty: 'Intellectual property',
  forceMajeure: 'Force majeure',
  delivery: 'Delivery obligations',
  compliance: 'Compliance obligations',
  operational: 'Operational obligations',
  researchFunding: 'Research/funding',
  miscellaneous: 'Miscellaneous'
};

export const THEME_DOMAINS = {
  commercial: 'legal',
  payment: 'legal',
  repayment: 'financial',
  mortgage: 'financial',
  penalties: 'financial',
  loanServicing: 'financial',
  creditDisclosure: 'financial',
  collectionRecovery: 'financial',
  liability: 'legal',
  indemnification: 'legal',
  termination: 'legal',
  confidentiality: 'legal',
  export: 'legal',
  governingLaw: 'legal',
  disputeResolution: 'legal',
  intellectualProperty: 'legal',
  forceMajeure: 'legal',
  delivery: 'legal',
  compliance: 'legal',
  operational: 'legal',
  privacy: 'privacy',
  researchFunding: 'research',
  miscellaneous: 'miscellaneous'
};

export const DOMAIN_LABELS = {
  legal: 'Legal Documents',
  privacy: 'Consumer Privacy Policies',
  research: 'Research/Funding Agreements',
  financial: 'Financial/Loan Agreements',
  miscellaneous: 'Miscellaneous'
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const FINANCIAL_THEME_KEYS = new Set(['repayment', 'mortgage', 'penalties', 'loanServicing', 'creditDisclosure', 'collectionRecovery']);

const calculateThemeConfidence = (share, rank, topShare) => {
  const rankPenalty = rank * 0.035;
  const dominanceBonus = topShare ? Math.min(0.12, (share / topShare) * 0.1) : 0;
  return Number(clamp(0.22 + Math.sqrt(share) * 0.58 + dominanceBonus - rankPenalty, 0.12, 0.91).toFixed(2));
};

export const aggregateThemeDominance = (sections) => {
  const themeTotals = {};

  for (const section of sections) {
    const sectionSum = Object.values(section.themeScores || {}).reduce((sum, value) => sum + value, 0) || 1;
    const sectionFactor = section.share * (section.themeConfidence || 0.35);

    Object.entries(section.themeScores || {}).forEach(([themeKey, score]) => {
      const normalized = score / sectionSum;
      themeTotals[themeKey] = (themeTotals[themeKey] || 0) + normalized * sectionFactor;
    });
  }

  const financialTotal = Object.entries(themeTotals)
    .filter(([key]) => FINANCIAL_THEME_KEYS.has(key))
    .reduce((sum, [, value]) => sum + value, 0);
  const allRawTotal = Object.values(themeTotals).reduce((sum, value) => sum + value, 0) || 1;

  if (financialTotal / allRawTotal >= 0.28) {
    themeTotals.export = (themeTotals.export || 0) * 0.28;
    themeTotals.compliance = (themeTotals.compliance || 0) * 0.62;
    themeTotals.privacy = (themeTotals.privacy || 0) * 0.72;
  }

  const total = Object.values(themeTotals).reduce((sum, value) => sum + value, 0) || 1;
  const sortedThemes = Object.entries(themeTotals)
    .map(([themeKey, value]) => ({
      key: themeKey,
      label: THEME_LABELS[themeKey] || themeKey,
      share: Number(clamp(value / total, 0, 1).toFixed(2))
    }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share);

  const topShare = sortedThemes[0]?.share || 0;
  const themeDominance = sortedThemes.map((theme, index) => ({
    ...theme,
    confidence: calculateThemeConfidence(theme.share, index, topShare),
    relevance: Number(clamp(theme.share * (index === 0 ? 1.18 : 1.04), 0.02, 1).toFixed(2)),
    semanticDominance: Number(clamp(theme.share / Math.max(topShare, 0.01), 0.03, 1).toFixed(2))
  }));

  const domainTotals = themeDominance.reduce((totals, theme) => {
    const domain = THEME_DOMAINS[theme.key] || 'miscellaneous';
    totals[domain] = (totals[domain] || 0) + theme.share;
    return totals;
  }, {});

  const domainTotal = Object.values(domainTotals).reduce((sum, value) => sum + value, 0) || 1;
  const domainDominance = Object.entries(domainTotals)
    .map(([domain, value]) => ({
      key: domain,
      label: DOMAIN_LABELS[domain] || domain,
      share: Number(clamp(value / domainTotal, 0, 1).toFixed(2))
    }))
    .sort((a, b) => b.share - a.share);

  const dominantDomain = domainDominance[0] || null;
  const secondaryDomains = domainDominance.slice(1).filter((entry) => entry.share >= 0.12);
  const weakDomains = domainDominance.slice(1).filter((entry) => entry.share >= 0.05 && entry.share < 0.12);

  const dominantLegalThemes = themeDominance
    .filter((theme) => ['legal', 'financial'].includes(THEME_DOMAINS[theme.key]) && theme.share >= 0.035)
    .slice(0, 10)
    .map((theme) => ({
      key: theme.key,
      label: theme.label,
      share: theme.share,
      confidence: theme.confidence,
      relevance: theme.relevance,
      semanticDominance: theme.semanticDominance
    }));

  return {
    themeDominance,
    dominantTheme: themeDominance[0] || null,
    dominantDomain,
    domainDominance,
    secondaryDomains,
    weakDomains,
    dominantLegalThemes,
    semanticOwnership: {
      dominant: dominantDomain ? [{ key: dominantDomain.key, label: dominantDomain.label, share: dominantDomain.share }] : [],
      secondary: secondaryDomains.map((entry) => ({ key: entry.key, label: entry.label, share: entry.share })),
      weak: weakDomains.map((entry) => ({ key: entry.key, label: entry.label, share: entry.share }))
    }
  };
};
