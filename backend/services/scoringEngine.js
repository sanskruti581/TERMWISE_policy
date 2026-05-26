const typeSensitivity = {
  'Privacy Policy': 1.0,
  'Terms & Conditions': 0.85,
  'Legal Contract': 0.65,
  'Financial Document': 0.8,
  'Research/Funding Agreement': 0.6,
  'Administrative Document': 0.5,
  Unknown: 0.75
};

const getPrivacyGrade = (score) => {
  if (score <= 20) return 'A';
  if (score <= 40) return 'B';
  if (score <= 60) return 'C';
  if (score <= 80) return 'D';
  return 'F';
};

const getRiskLevel = (score) => {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Moderate';
  if (score <= 60) return 'Risky';
  if (score <= 80) return 'High Risk';
  return 'Severe Risk';
};

const getSeverity = (points) => {
  if (points >= 30) return 'High Risk';
  if (points >= 25) return 'Risky';
  if (points >= 15) return 'Moderate';
  return 'Safe';
};

export const getTypeSensitivity = (documentType) => typeSensitivity[documentType] ?? typeSensitivity.Unknown;

export const calculateRiskScore = (detectedRisks, positiveIndicators, documentType) => {
  const rawRiskWeight = detectedRisks.reduce((total, risk) => {
    const certaintyFactor = Math.max(0.35, Math.min(1, (risk.certainty || 65) / 100));
    return total + ((risk.points || 0) * certaintyFactor);
  }, 0);

  const totalWeight = 125;
  const baseNormalized = totalWeight > 0 ? Math.round((rawRiskWeight / totalWeight) * 100) : 0;
  const sensitivity = getTypeSensitivity(documentType);
  const positiveReduction = Math.min(18, positiveIndicators.reduce((total, indicator) => total + (indicator.reduction || 0), 0));
  const scored = Math.round(baseNormalized * sensitivity) - positiveReduction;
  return Math.max(0, Math.min(100, scored));
};

export const determineAnalysisReliability = (detectedRisks, documentTypeConfidence, contextSignalCount = 0) => {
  const riskCount = detectedRisks.length;
  const signalBoost = Math.min(20, contextSignalCount * 4);
  const stability = Math.max(0, 20 - Math.abs(2 - riskCount) * 5);
  const score = Math.min(95, Math.round(documentTypeConfidence * 0.55 + signalBoost + stability));
  const label = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';
  return { score: Math.max(40, score), label };
};

export const getSeverityLabel = getSeverity;
export const getRiskGrade = getPrivacyGrade;
export const getRiskLevelLabel = getRiskLevel;

export const buildAdaptiveRiskProfile = ({ score, documentType, documentDomain, highlightedClauses = [], detectedRisks = [] }) => {
  const label = (() => {
    if (documentType === 'Privacy Policy' || /privacy/i.test(documentDomain || '')) return 'Privacy Risk Score';
    if (documentType === 'Financial Document' || /financial|loan/i.test(documentDomain || '')) return 'Consumer Financial Exposure Score';
    if (/research|funding/i.test(documentDomain || '')) return 'Compliance/Operational Complexity Score';
    return 'Contractual Obligation Score';
  })();

  const clauseImpact = highlightedClauses.reduce((max, clause) => Math.max(max, clause.dimensions?.riskSeverity || 0), 0);
  const adjustedScore = Math.max(0, Math.min(100, Math.round(score * 0.78 + clauseImpact * 22 + Math.min(10, detectedRisks.length * 2))));
  const description = (() => {
    if (/Financial/.test(label)) return 'Measures borrower-facing obligations, penalties, collection exposure, collateral impact, and disclosure sensitivity.';
    if (/Privacy/.test(label)) return 'Measures data collection, sharing, retention, tracking, consent quality, and consumer privacy protections.';
    if (/Compliance/.test(label)) return 'Measures reporting duties, compliance load, operational complexity, and governance obligations.';
    return 'Measures contractual duties, liability exposure, operational dependencies, and legal protection terms.';
  })();

  return {
    label,
    score: adjustedScore,
    description,
    grade: getPrivacyGrade(adjustedScore),
    level: getRiskLevel(adjustedScore)
  };
};
