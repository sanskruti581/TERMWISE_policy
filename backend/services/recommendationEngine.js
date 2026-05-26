const baseDefaults = {
  'Privacy Policy': [
    'Review cookie and tracking disclosures, consent controls, and data selling practices.',
    'Verify retention, deletion, and user rights language for personal data.'
  ],
  'Terms & Conditions': [
    'Focus on payment terms, account obligations, and dispute resolution language.',
    'Check whether service usage, termination, and liability terms are clear.'
  ],
  'Legal Contract': [
    'Review confidentiality, liability, dispute, and termination clauses carefully.',
    'Confirm whether obligations are clearly scoped and whether there are strong indemnity provisions.'
  ],
  'Research/Funding Agreement': [
    'Confirm confidentiality obligations, reporting deadlines, and data ownership provisions.',
    'Review grant conditions, publication rights, and compliance requirements.'
  ],
  'Administrative Document': [
    'Focus on internal compliance, governance expectations, and recordkeeping requirements.',
    'Check whether operational responsibilities and approval processes are clearly defined.'
  ],
  Unknown: ['The document type is unclear. Review it carefully for privacy, contractual, and compliance language.']
};

const riskRecommendations = {
  'Data selling': 'Prefer vendors that clearly disclose data sales and provide an easy opt-out option.',
  'Biometric collection': 'Avoid biometric data processing unless collection, storage, and deletion are explicitly defined.',
  'Third-party sharing and marketing partners': 'Review third-party sharing clauses and confirm whether marketing or analytics partners can access personal data.',
  'Location tracking': 'Use location controls and ensure tracking is necessary for the service stated.',
  'Cookies and advertising tracking': 'Look for explicit cookie controls and opt-out language for personalized advertising.',
  'Permanent data retention': 'Watch for indefinite retention language and prefer maximum retention limits.',
  'Weak user consent': 'Prefer explicit, purpose-specific consent rather than catch-all acceptance through use.'
};

export const buildRecommendations = (documentType, detectedRisks = [], contextSignals = []) => {
  const recommendations = [];

  if (detectedRisks.length) {
    recommendations.push(...detectedRisks.map((risk) => risk.recommendation).filter(Boolean));
  }

  if (contextSignals.length) {
    if (documentType === 'Research/Funding Agreement') {
      recommendations.push('Confirm that research compliance signals match the expected funding or grant terms.');
    }
    if (documentType === 'Legal Contract') {
      recommendations.push('Validate that confidentiality and obligation signals reflect contract-based protections.');
    }
  }

  detectedRisks.forEach((risk) => {
    if (riskRecommendations[risk.category]) {
      recommendations.push(riskRecommendations[risk.category]);
    }
  });

  if (!recommendations.length) {
    recommendations.push(...(baseDefaults[documentType] || baseDefaults.Unknown));
  }

  return [...new Set(recommendations)].slice(0, 8);
};
