/**
 * Adaptive score labeling based on document domain
 * Maps document types to appropriate score names and descriptions
 */

const SCORE_LABEL_MAP = {
  'Privacy Policy': {
    label: 'Privacy Exposure Level',
    description: 'Interprets data collection, sharing, retention, and consent obligations.',
    riskFramework: 'privacy-focused'
  },
  'Loan Agreement': {
    label: 'Consumer Financial Exposure',
    description: 'Interprets repayment duties, penalty triggers, default terms, and borrower liability.',
    riskFramework: 'financial'
  },
  'Procurement Agreement': {
    label: 'Operational Compliance Exposure',
    description: 'Interprets vendor obligations, compliance burden, performance standards, and enforcement terms.',
    riskFramework: 'compliance'
  },
  'Vendor Contract': {
    label: 'Contractual Enforcement Severity',
    description: 'Interprets enforcement mechanisms, termination authority, remedies, and liability allocation.',
    riskFramework: 'enforcement'
  },
  'Employment Agreement': {
    label: 'Workplace Obligation Exposure',
    description: 'Interprets employee duties, restrictions, termination terms, and workplace protections.',
    riskFramework: 'employment'
  },
  'Research Agreement': {
    label: 'Data Responsibility Burden',
    description: 'Interprets data handling duties, usage limits, confidentiality, and research protections.',
    riskFramework: 'data-responsibility'
  },
  'Terms of Service': {
    label: 'User Obligation Exposure',
    description: 'Interprets user restrictions, platform authority, content rights, and account remedies.',
    riskFramework: 'user-terms'
  },
  'Service Agreement': {
    label: 'Service Obligation Exposure',
    description: 'Interprets service duties, performance requirements, warranties, and responsibility limits.',
    riskFramework: 'service'
  }
};

/**
 * Get adaptive score label for a document
 * @param {string} documentType - The detected document type
 * @returns {object} Score label object with label, description, and framework
 */
export const getAdaptiveScoreLabel = (documentType) => {
  if (!documentType) {
    return {
      label: 'Legal Exposure Level',
      description: 'Interprets obligations, enforcement terms, protections, and review areas.',
      riskFramework: 'general'
    };
  }

  // Exact match
  if (SCORE_LABEL_MAP[documentType]) {
    return SCORE_LABEL_MAP[documentType];
  }

  // Fuzzy match for partial matches
  const lowerType = documentType.toLowerCase();
  for (const [key, config] of Object.entries(SCORE_LABEL_MAP)) {
    if (lowerType.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerType)) {
      return config;
    }
  }

  // Default fallback
  return {
    label: `${documentType} Exposure Level`,
    description: 'Interprets obligations, enforcement terms, protections, and review areas.',
    riskFramework: 'general'
  };
};

/**
 * Get all available score label mappings
 * @returns {object} Full mapping object
 */
export const getScoreLabelMappings = () => SCORE_LABEL_MAP;

/**
 * Check if a document type has a custom score label
 * @param {string} documentType
 * @returns {boolean}
 */
export const hasCustomScoreLabel = (documentType) => {
  if (!documentType) return false;
  return !!SCORE_LABEL_MAP[documentType];
};

/**
 * Get risk framework for a document type
 * Useful for conditional styling or analysis focus
 * @param {string} documentType
 * @returns {string} Risk framework key
 */
export const getRiskFramework = (documentType) => {
  const config = getAdaptiveScoreLabel(documentType);
  return config.riskFramework;
};
