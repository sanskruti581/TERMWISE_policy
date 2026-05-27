import { normalizeText, findMatches } from './phraseMatcher.js';

const subtypePatterns = {
  financialLoan: [/home loan/i, /loan agreement/i, /borrower/i, /\bEMI\b/i, /repayment schedule/i, /sanction letter/i],
  mortgageLoan: [/mortgage/i, /collateral/i, /security interest/i, /hypothecation/i, /secured asset/i],
  procurement: [/procurement/i, /supplier/i, /vendor/i, /purchase order/i, /delivery obligations?/i, /goods and services/i],
  employment: [/employment/i, /employee/i, /compensation/i, /benefits?/i, /termination/i, /non[-\s]?compete/i, /severance/i],
  privacyCompliance: [/data protection/i, /gdpr/i, /privacy policy/i, /data subject rights/i, /consent/i, /personal data/i],
  researchFunding: [/funding/i, /grant/i, /sponsor/i, /research partner/i, /project deliverables?/i, /consortium/i],
  exportCompliance: [/export control/i, /sanctions?/i, /customs?/i, /trade control/i, /regulatory compliance/i],
  commercial: [/payment terms?/i, /invoice/i, /purchase price/i, /sales? terms?/i, /delivery obligations?/i, /fee(?:s)?/i]
};

const getThemeShare = (themeDominance, key) => {
  if (!Array.isArray(themeDominance)) return 0;
  const item = themeDominance.find((theme) => theme.key === key || theme.label.toLowerCase().includes(key));
  return item?.share || 0;
};

const countMatchPatterns = (text, patterns) => (patterns || []).reduce((count, pattern) => count + (findMatches(text, [pattern]).length > 0 ? 1 : 0), 0);

const classifyDomain = (classification, themeSummary) => {
  if (themeSummary?.dominantDomain?.label) {
    return {
      documentDomain: themeSummary.dominantDomain.label,
      documentDomainConfidence: Math.max(
        45,
        Math.min(95, Math.round(themeSummary.dominantDomain.share * 100 * 0.8 + classification.documentTypeConfidence * 0.2))
      )
    };
  }

  switch (classification.documentType) {
    case 'Privacy Policy':
      return { documentDomain: 'Consumer Privacy Policies', documentDomainConfidence: Math.max(45, classification.documentTypeConfidence) };
    case 'Research/Funding Agreement':
      return { documentDomain: 'Research/Funding Agreements', documentDomainConfidence: Math.max(45, classification.documentTypeConfidence) };
    case 'Administrative Document':
      return { documentDomain: 'Administrative Documents', documentDomainConfidence: Math.max(45, classification.documentTypeConfidence) };
    case 'Financial Document':
      return { documentDomain: 'Financial/Loan Agreements', documentDomainConfidence: Math.max(55, classification.documentTypeConfidence) };
    case 'Legal Contract':
    case 'Terms & Conditions':
      return { documentDomain: 'Legal Documents', documentDomainConfidence: Math.max(45, classification.documentTypeConfidence) };
    default:
      return { documentDomain: classification.documentType || 'Legal Documents', documentDomainConfidence: Math.max(45, classification.documentTypeConfidence) };
  }
};

const procurementHint = (text) => {
  return /procurement|supplier|vendor|purchase order|goods and services|purchase contract/i.test(text);
};

const employmentHint = (text) => {
  return /employee|employment agreement|compensation|benefits|non[-\s]?competition|termination benefits|at will employment/i.test(text);
};

const operationalIntentHint = (text) => {
  return /service provider|vendor|supplier|procurement|operations?|maintenance|support|maintenance obligations?|hygiene|sanitation|compliance|standards?/i.test(text);
};

const hasContractComplianceSignals = (text) => {
  return /compliance|standards?|hygiene|sanitation|health and safety|penal(?:ty| charges?)|fines|termination|breach/i.test(text);
};

export const classifyLegalSubtype = (classification, themeSummary, text) => {
  const normalized = normalizeText(text);
  const commercialShare = getThemeShare(themeSummary.themeDominance, 'commercial');
  const privacyShare = getThemeShare(themeSummary.themeDominance, 'privacy');
  const confidentialityShare = getThemeShare(themeSummary.themeDominance, 'confidentiality');
  const exportShare = getThemeShare(themeSummary.themeDominance, 'export');
  const liabilityShare = getThemeShare(themeSummary.themeDominance, 'liability');
  const operationalShare = getThemeShare(themeSummary.themeDominance, 'operational');
  const _deliveryShare = getThemeShare(themeSummary.themeDominance, 'delivery');

  const patterns = {
    procurement: countMatchPatterns(normalized, subtypePatterns.procurement),
    financialLoan: countMatchPatterns(normalized, subtypePatterns.financialLoan),
    mortgageLoan: countMatchPatterns(normalized, subtypePatterns.mortgageLoan),
    employment: countMatchPatterns(normalized, subtypePatterns.employment),
    privacyCompliance: countMatchPatterns(normalized, subtypePatterns.privacyCompliance),
    researchFunding: countMatchPatterns(normalized, subtypePatterns.researchFunding),
    exportCompliance: countMatchPatterns(normalized, subtypePatterns.exportCompliance),
    commercial: countMatchPatterns(normalized, subtypePatterns.commercial)
  };

  let documentSubtype = 'Legal/contract document';
  let documentSubtypeConfidence = 50;

  const roleKeys = new Set(classification.actorRoles?.map((r) => r.key) || []);
  const hasBorrowerContext = roleKeys.has('borrower') || roleKeys.has('lender');
  const hasOperationalContext = roleKeys.has('contractor') || roleKeys.has('vendor') || roleKeys.has('university') || roleKeys.has('purchaser');

  // Procurement / Operational contract domains (penalties can be enforcement/compliance, not lending).
  if (hasOperationalContext && (patterns.procurement >= 1 || operationalIntentHint(normalized) || hasContractComplianceSignals(normalized))) {
    if (patterns.employment >= 1) {
      documentSubtype = 'Operational compliance / employment service contract';
      documentSubtypeConfidence = 60;
    } else if (patterns.procurement >= 1) {
      documentSubtype = 'Procurement / contractor vendor agreement';
      documentSubtypeConfidence = 66;
    } else {
      documentSubtype = 'Operational compliance agreement';
      documentSubtypeConfidence = 58;
    }
  } else if (classification.documentType === 'Financial Document' || patterns.financialLoan >= 2 || patterns.mortgageLoan >= 1) {
    // If borrower context is absent but financial vocabulary is present, demote to operational compliance.
    if (!hasBorrowerContext && hasOperationalContext) {
      documentSubtype = 'Service/Operational compliance agreement';
      documentSubtypeConfidence = 58;
    } else if (patterns.mortgageLoan >= 1) {
      documentSubtype = 'Mortgage/secured loan agreement';
      documentSubtypeConfidence = 70 + Math.round(Math.min(14, patterns.mortgageLoan * 4 + patterns.financialLoan * 2));
    } else {
      documentSubtype = 'Loan repayment agreement';
      documentSubtypeConfidence = 68 + Math.round(Math.min(14, patterns.financialLoan * 4));
    }
  } else if (classification.documentType === 'Research/Funding Agreement') {
    if (patterns.researchFunding >= 2 || commercialShare > 0.18) {
      documentSubtype = 'Research funding agreement';
      documentSubtypeConfidence = 65 + Math.round(Math.min(20, patterns.researchFunding * 5));
    } else if (patterns.procurement >= 1 || commercialShare > 0.32) {
      documentSubtype = 'Procurement agreement';
      documentSubtypeConfidence = 62;
    } else {
      documentSubtype = 'Research funding agreement';
      documentSubtypeConfidence = 55;
    }
  } else if (classification.documentType === 'Legal Contract' || classification.documentType === 'Terms & Conditions') {
    if (patterns.procurement >= 1 || procurementHint(normalized)) {
      documentSubtype = 'Procurement agreement';
      documentSubtypeConfidence = 69;
    } else if (patterns.employment >= 1 || employmentHint(normalized)) {
      documentSubtype = 'Employment agreement';
      documentSubtypeConfidence = 66;
    } else if (privacyShare >= 0.22 && confidentialityShare >= 0.14) {
      documentSubtype = 'Privacy/compliance document';
      documentSubtypeConfidence = 64;
    } else if (commercialShare >= 0.28 && liabilityShare >= 0.18) {
      documentSubtype = 'Commercial contract';
      documentSubtypeConfidence = 72;
    } else if (exportShare >= 0.2) {
      documentSubtype = 'Compliance document';
      documentSubtypeConfidence = 60;
    } else if (operationalShare >= 0.25) {
      documentSubtype = 'Operational agreement';
      documentSubtypeConfidence = 58;
    } else {
      documentSubtype = 'Commercial contract';
      documentSubtypeConfidence = 56 + Math.round(Math.min(20, commercialShare * 100));
    }
  } else if (classification.documentType === 'Administrative Document') {
    if (privacyShare >= 0.22 || exportShare >= 0.18) {
      documentSubtype = 'Compliance document';
      documentSubtypeConfidence = 58;
    } else {
      documentSubtype = 'Operational agreement';
      documentSubtypeConfidence = 55;
    }
  } else if (classification.documentType === 'Privacy Policy') {
    documentSubtype = 'Privacy/compliance document';
    documentSubtypeConfidence = 70 + Math.round(Math.min(20, privacyShare * 50));
  } else {
    documentSubtype = classification.documentType || 'Legal/contract document';
    documentSubtypeConfidence = Math.max(45, classification.documentTypeConfidence - 5);
  }

  documentSubtypeConfidence = Math.max(40, Math.min(95, documentSubtypeConfidence));
  const domain = classifyDomain(classification, themeSummary);

  return {
    ...domain,
    documentSubtype,
    documentSubtypeConfidence
  };
};

