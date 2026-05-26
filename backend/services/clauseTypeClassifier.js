import { splitTextIntoSentences } from './phraseMatcher.js';

const clauseDefinitions = [
  {
    clauseType: 'Financial obligation clause',
    severity: 'Moderate operational impact',
    category: 'Repayment Obligation',
    explanation: 'Defines borrower payment duties, repayment timing, instalments, or amounts due.',
    patterns: [/\bEMI\b/i, /repayment/i, /instal(?:l)?ment/i, /amount payable/i, /due date/i, /interest rate/i]
  },
  {
    clauseType: 'Consumer-risk clause',
    severity: 'Consumer-sensitive',
    category: 'Penalty Clause',
    explanation: 'Creates consumer sensitivity through default, late payment, penalty, or foreclosure consequences.',
    patterns: [/penal(?:ty| charges?)/i, /late payment/i, /default interest/i, /foreclosure/i, /overdue/i, /bounce charges?/i]
  },
  {
    clauseType: 'Disclosure clause',
    severity: 'Consumer-sensitive',
    category: 'Disclosure Clause',
    explanation: 'Allows disclosure of borrower or account information to bureaus, affiliates, regulators, or service providers.',
    patterns: [/authorized to disclose/i, /disclose information/i, /credit bureau/i, /\bCIBIL\b/i, /share information with/i]
  },
  {
    clauseType: 'Collection/recovery clause',
    severity: 'Moderate operational impact',
    category: 'Collection Clause',
    explanation: 'Permits collection, recovery, or third-party operational activity for overdue obligations.',
    patterns: [/collection purpose/i, /recovery agent/i, /debt collection/i, /third parties appointed/i, /recover(?:y)? proceedings?/i]
  },
  {
    clauseType: 'Legal protection clause',
    severity: 'Low relevance',
    category: 'Security/Collateral Clause',
    explanation: 'Defines collateral, mortgage, security interest, or lender protection terms.',
    patterns: [/collateral/i, /mortgage/i, /security interest/i, /hypothecation/i, /charge over/i, /secured asset/i]
  },
  {
    clauseType: 'Compliance clause',
    severity: 'Low relevance',
    category: 'Compliance Clause',
    explanation: 'References statutory, regulatory, audit, or lawful processing obligations.',
    patterns: [/regulatory/i, /compliance/i, /statutory/i, /as required by law/i, /lawful/i, /audit/i]
  },
  {
    clauseType: 'Operational clause',
    severity: 'Low relevance',
    category: 'Operational Clause',
    explanation: 'Describes service, servicing, administration, or procedural operations.',
    patterns: [/loan servicing/i, /service provider/i, /appoint(?:ed)? third part/i, /processing/i, /procedure/i]
  },
  {
    clauseType: 'Privacy-risk clause',
    severity: 'High privacy concern',
    category: 'Privacy Risk Clause',
    explanation: 'Indicates high-sensitivity data collection, tracking, sale, or advertising use.',
    patterns: [/sell(?:ing)? personal/i, /targeted advertis/i, /tracking pixel/i, /precise location/i, /biometric/i]
  }
];

const MAX_HIGHLIGHT_LENGTH = 280;
const impactDefaults = {
  'Financial obligation clause': { consumerSensitivity: 0.72, operationalImpact: 0.62, financialImpact: 0.82, legalEnforceability: 0.62, privacyImpact: 0.08, riskSeverity: 0.64 },
  'Consumer-risk clause': { consumerSensitivity: 0.88, operationalImpact: 0.5, financialImpact: 0.78, legalEnforceability: 0.58, privacyImpact: 0.12, riskSeverity: 0.76 },
  'Disclosure clause': { consumerSensitivity: 0.72, operationalImpact: 0.42, financialImpact: 0.4, legalEnforceability: 0.54, privacyImpact: 0.58, riskSeverity: 0.62 },
  'Collection/recovery clause': { consumerSensitivity: 0.68, operationalImpact: 0.74, financialImpact: 0.66, legalEnforceability: 0.6, privacyImpact: 0.18, riskSeverity: 0.58 },
  'Legal protection clause': { consumerSensitivity: 0.38, operationalImpact: 0.42, financialImpact: 0.6, legalEnforceability: 0.76, privacyImpact: 0.04, riskSeverity: 0.42 },
  'Compliance clause': { consumerSensitivity: 0.22, operationalImpact: 0.48, financialImpact: 0.16, legalEnforceability: 0.68, privacyImpact: 0.2, riskSeverity: 0.28 },
  'Operational clause': { consumerSensitivity: 0.18, operationalImpact: 0.62, financialImpact: 0.22, legalEnforceability: 0.42, privacyImpact: 0.08, riskSeverity: 0.24 },
  'Privacy-risk clause': { consumerSensitivity: 0.86, operationalImpact: 0.35, financialImpact: 0.12, legalEnforceability: 0.4, privacyImpact: 0.92, riskSeverity: 0.84 }
};

const cleanClause = (sentence) => {
  const compact = String(sentence || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= MAX_HIGHLIGHT_LENGTH) return compact;
  return `${compact.slice(0, MAX_HIGHLIGHT_LENGTH).trim()}...`;
};

const matchesAny = (sentence, patterns) => patterns.some((pattern) => pattern.test(sentence));

export const classifyClauseTypes = (text) => {
  const sentences = splitTextIntoSentences(text);
  const clauses = [];

  for (const sentence of sentences) {
    const matchedDefinitions = clauseDefinitions.filter((definition) => matchesAny(sentence, definition.patterns));
    if (!matchedDefinitions.length) continue;

    const primary = matchedDefinitions[0];
    clauses.push({
      category: primary.category,
      clauseType: primary.clauseType,
      severity: primary.severity,
      sensitivity: primary.severity,
      sentence: cleanClause(sentence),
      explanation: primary.explanation,
      dimensions: impactDefaults[primary.clauseType] || impactDefaults['Operational clause'],
      badges: matchedDefinitions.map((definition) => definition.category),
      intentTypes: matchedDefinitions.map((definition) => definition.clauseType)
    });
  }

  const seen = new Set();
  return clauses.filter((clause) => {
    const key = `${clause.category}:${clause.sentence.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
};

export const summarizeClauseTypes = (clauses = []) => {
  return clauses.reduce((totals, clause) => {
    totals[clause.clauseType] = (totals[clause.clauseType] || 0) + 1;
    return totals;
  }, {});
};
