const priority = (level, text) => ({ priority: level, text });

const themeLabels = {
  repayment: 'repayment obligations',
  mortgage: 'collateral/security requirements',
  penalties: 'penalty and default clauses',
  creditDisclosure: 'credit bureau disclosure permissions',
  collectionRecovery: 'collection/recovery activity',
  liability: 'liability limitations',
  payment: 'payment obligations',
  delivery: 'delivery responsibilities',
  disputeResolution: 'dispute-resolution terms',
  confidentiality: 'confidentiality protections',
  privacy: 'privacy/data handling clauses',
  advertising: 'tracking and advertising clauses'
};

const getDomainKey = (analysisMode = {}) => analysisMode.key || 'legal';

const hasTheme = (themes, key) => themes.some((theme) => theme.key === key && (theme.share || 0) >= 0.04);

export const buildAdaptiveRecommendations = ({ analysisMode, themeSummary = {}, detectedRisks = [], highlightedClauses = [], relationship } = {}) => {
  const domain = getDomainKey(analysisMode);

  const roleKeys = new Set((relationship?.roles || []).map((r) => r.key));
  const hasBorrowerContext = roleKeys.has('borrower') || roleKeys.has('lender');
  const hasOperationalContext = roleKeys.has('contractor') || roleKeys.has('vendor') || roleKeys.has('university') || roleKeys.has('purchaser');

  const themes = themeSummary.themeDominance || [];
  const recommendations = [];

  // Domain guardrails: only emit financial-mode advice when borrower/lender context exists.
  // Operational penalty language (contractor/vendor/university) should not trigger loan/foreclosure advice.
  const shouldUseFinancial = domain === 'financial' && hasBorrowerContext;


  if (domain === 'privacy') {
    recommendations.push(priority('High', 'Review tracking permissions, advertising-sharing clauses, retention language, and consent controls before accepting.'));

    if (detectedRisks.some((risk) => /tracking|advertising|sharing/i.test(risk.category))) {

      recommendations.push(priority('High', 'Check whether third-party analytics or advertising partners can receive identifiable data.'));
    }
    if (hasTheme(themes, 'privacy')) recommendations.push(priority('Medium', 'Confirm deletion, opt-out, and data subject rights are practical and clearly described.'));
  } else if (domain === 'financial') {
    if (shouldUseFinancial) {
      recommendations.push(priority('High', 'Review repayment obligations, foreclosure conditions, penalty clauses, and credit disclosure permissions before signing.'));
      if (hasTheme(themes, 'penalties')) recommendations.push(priority('High', 'Compare penal charges, default interest, and overdue consequences with the loan sanction terms.'));
      if (hasTheme(themes, 'creditDisclosure')) recommendations.push(priority('Medium', 'Confirm what information may be reported to credit bureaus and when borrower consent applies.'));
      if (hasTheme(themes, 'collectionRecovery')) recommendations.push(priority('Medium', 'Review collection/recovery language, including third-party collection authority and contact practices.'));
    } else {
      // Fallback for operational contracts that accidentally land in financial mode due to penalty/charge vocabulary.
      recommendations.push(priority('High', 'Treat penalty/charge language as enforcement/compliance mechanics for the contractor/vendor service; review operational penalties, termination triggers, and service compliance obligations.'));
    }
  } else if (domain === 'research') {

    recommendations.push(priority('High', 'Review reporting duties, compliance obligations, confidentiality terms, and deliverable ownership.'));
    if (hasTheme(themes, 'compliance')) recommendations.push(priority('Medium', 'Confirm audit, statutory, and grant-compliance obligations are operationally realistic.'));
  } else {
    recommendations.push(priority('High', 'Check liability limitations, payment obligations, delivery responsibilities, and dispute-resolution terms carefully.'));
    if (hasTheme(themes, 'indemnification')) recommendations.push(priority('Medium', 'Validate indemnification scope, claim procedures, and defense obligations.'));
    if (hasTheme(themes, 'confidentiality')) recommendations.push(priority('Medium', 'Confirm confidentiality duties, exceptions, survival periods, and permitted disclosures.'));
    if (hasTheme(themes, 'termination')) recommendations.push(priority('Medium', 'Review termination triggers, notice requirements, and post-termination obligations.'));
  }

  const clauseTypes = new Set(highlightedClauses.map((clause) => clause.clauseType).filter(Boolean));
  clauseTypes.forEach((type) => {
    if (/privacy/i.test(type)) recommendations.push(priority('High', 'Treat high privacy concern clauses as requiring direct consent and clear purpose limits.'));
    if (/financial|consumer/i.test(type)) recommendations.push(priority('Medium', 'Review consumer-sensitive financial clauses for cost, timing, and enforcement impact.'));
  });

  const topThemes = themes
    .filter((theme) => (theme.share || 0) >= 0.08)
    .slice(0, 3)
    .map((theme) => themeLabels[theme.key] || theme.label?.toLowerCase())
    .filter(Boolean);

  if (topThemes.length) {
    recommendations.push(priority('Low', `Use the dominant semantic themes as a review checklist: ${topThemes.join(', ')}.`));
  }

  const seen = new Set();
  return recommendations.filter((item) => {
    if (seen.has(item.text)) return false;
    seen.add(item.text);
    return true;
  }).slice(0, 8);
};
