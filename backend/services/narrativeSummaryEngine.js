const phraseMap = {
  loan: 'home loan borrower responsibilities',
  repayment: 'loan repayment conditions',
  mortgage: 'mortgage and collateral requirements',
  penalties: 'penalties and default consequences',
  servicing: 'loan servicing procedures',
  disclosure: 'credit bureau and disclosure permissions',
  collection: 'collection and recovery activity',
  payment: 'payment obligations',
  liability: 'liability protections',
  confidentiality: 'confidentiality duties',
  delivery: 'delivery responsibilities',
  compliance: 'operational compliance procedures',
  privacy: 'privacy and data protection references',
  commercial: 'commercial obligations',
  governingLaw: 'governing law terms'
};

const joinNatural = (items) => {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const fromFinancialSignals = (financialClassification) => {
  return (financialClassification.financialSignals || [])
    .map((signal) => phraseMap[signal.key] || signal.key)
    .slice(0, 6);
};

const fromThemes = (themeDominance = []) => {
  return themeDominance
    .filter((theme) => theme.share >= 0.04)
    .slice(0, 5)
    .map((theme) => phraseMap[theme.key] || String(theme.label || '').toLowerCase());
};

export const buildNarrativeSummary = ({ subtype = {}, themeSummary = {}, financialClassification = {}, clauseTypeSummary = {} }) => {
  const domain = subtype.documentDomain || 'Legal Documents';
  const subtypeLabel = subtype.documentSubtype || financialClassification.financialSubtype || 'document';
  const financialPhrases = financialClassification.isFinancial ? fromFinancialSignals(financialClassification) : [];
  const themePhrases = fromThemes(themeSummary.themeDominance);
  const clausePhrases = Object.keys(clauseTypeSummary)
    .map((type) => type.toLowerCase().replace(' clause', ' clauses'))
    .slice(0, 3);

  const phrases = [...new Set([...financialPhrases, ...themePhrases, ...clausePhrases])].slice(0, 6);

  if (financialClassification.isFinancial) {
    return `This ${subtypeLabel.toLowerCase()} primarily defines ${joinNatural(phrases || ['borrower responsibilities', 'repayment duties', 'security requirements'])}.`;
  }

  if (domain === 'Consumer Privacy Policies') {
    return `This document primarily explains ${joinNatural(phrases.length ? phrases : ['privacy rights', 'data handling practices', 'user control options'])}.`;
  }

  return `This document primarily defines ${joinNatural(phrases.length ? phrases : ['legal obligations', 'operational responsibilities', 'compliance expectations'])}.`;
};
