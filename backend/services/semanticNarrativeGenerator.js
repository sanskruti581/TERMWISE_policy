const phraseMap = {
  repayment: 'borrower repayment responsibilities',
  mortgage: 'collateral and security requirements',
  penalties: 'default penalties and overdue consequences',
  loanServicing: 'loan servicing conditions',
  creditDisclosure: 'credit bureau disclosure permissions',
  collectionRecovery: 'collection and recovery procedures',
  privacy: 'user-data collection and data handling practices',
  advertising: 'tracking technologies and advertising partnerships',
  payment: 'payment conditions',
  delivery: 'delivery responsibilities',
  liability: 'liability limitations',
  indemnification: 'indemnification protections',
  confidentiality: 'confidentiality protections',
  disputeResolution: 'dispute-resolution responsibilities',
  governingLaw: 'governing law terms',
  commercial: 'commercial obligations',
  compliance: 'compliance requirements',
  researchFunding: 'funding and reporting obligations'
};

const joinNatural = (items) => {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const topPhrases = (themes = []) => themes
  .filter((theme) => !theme.suppressed && (theme.share || 0) >= 0.035)
  .slice(0, 5)
  .map((theme) => phraseMap[theme.key] || String(theme.label || '').toLowerCase())
  .filter(Boolean);

export const generateSemanticNarrative = ({ analysisMode = {}, subtype = {}, themeSummary = {} }) => {
  const phrases = topPhrases(themeSummary.themeDominance || []);
  const fallback = {
    privacy: ['user-data collection', 'tracking technologies', 'third-party sharing', 'consent-based processing'],
    financial: ['borrower repayment responsibilities', 'collateral requirements', 'default penalties', 'loan servicing conditions'],
    legal: ['commercial obligations', 'liability limitations', 'payment conditions', 'dispute-resolution responsibilities'],
    research: ['funding obligations', 'reporting duties', 'compliance requirements', 'operational responsibilities']
  };
  const selected = phrases.length ? phrases : fallback[analysisMode.key] || fallback.legal;

  if (analysisMode.key === 'privacy') {
    return `This policy primarily describes ${joinNatural(selected)}.`;
  }
  if (analysisMode.key === 'financial') {
    const name = /mortgage/i.test(subtype.documentSubtype || '') ? 'mortgage agreement' : 'financial agreement';
    return `This ${name} primarily defines ${joinNatural(selected)}.`;
  }
  if (analysisMode.key === 'research') {
    return `This research or funding document primarily establishes ${joinNatural(selected)}.`;
  }
  return `This agreement primarily establishes ${joinNatural(selected)}.`;
};
