import { findMatches, normalizeText } from './phraseMatcher.js';

const financialPatterns = {
  loan: [/home loan/i, /loan agreement/i, /loan account/i, /borrower/i, /lender/i, /sanction letter/i],
  repayment: [/\bEMI\b/i, /equated monthly instal(?:l)?ment/i, /repayment schedule/i, /repay(?:ment)? obligation/i, /monthly instal(?:l)?ment/i],
  mortgage: [/mortgage/i, /hypothecation/i, /collateral/i, /security interest/i, /secured asset/i, /charge over/i],
  penalties: [/penal(?:ty| charges?)/i, /late payment/i, /default interest/i, /overdue amount/i, /bounce charges?/i],
  servicing: [/loan servicing/i, /foreclosure/i, /prepayment/i, /part payment/i, /statement of account/i],
  disclosure: [/credit bureau/i, /cibil/i, /transunion/i, /authorized to disclose/i, /disclose information/i],
  collection: [/collection purpose/i, /recovery agent/i, /debt collection/i, /collection agency/i, /recover(?:y)? proceedings?/i]
};

const count = (text, patterns) => patterns.reduce((sum, pattern) => sum + findMatches(text, [pattern]).length, 0);

export const classifyFinancialDocument = (text, sections = []) => {
  const normalized = normalizeText(text);
  const signals = Object.entries(financialPatterns).map(([key, patterns]) => ({
    key,
    occurrences: count(normalized, patterns)
  }));

  const totalOccurrences = signals.reduce((sum, signal) => sum + signal.occurrences, 0);
  const sectionSupport = sections.filter((section) => /loan|borrower|repayment|emi|mortgage|collateral|credit bureau|collection/i.test(`${section.heading} ${section.text}`)).length;
  const isFinancial = totalOccurrences >= 3 || (totalOccurrences >= 2 && sectionSupport >= 1);
  const confidence = Math.max(0, Math.min(95, Math.round(42 + Math.min(34, totalOccurrences * 4.2) + Math.min(14, sectionSupport * 3))));

  const dominantSignals = signals
    .filter((signal) => signal.occurrences > 0)
    .sort((a, b) => b.occurrences - a.occurrences);

  let subtype = 'Financial document';
  if (dominantSignals.some((signal) => signal.key === 'mortgage')) subtype = 'Mortgage/secured loan agreement';
  else if (dominantSignals.some((signal) => signal.key === 'repayment')) subtype = 'Loan repayment agreement';
  else if (dominantSignals.some((signal) => signal.key === 'disclosure')) subtype = 'Financial disclosure document';

  return {
    isFinancial,
    financialConfidence: isFinancial ? confidence : 0,
    financialSubtype: subtype,
    financialSignals: dominantSignals,
    financialThemes: dominantSignals.map((signal) => signal.key)
  };
};
