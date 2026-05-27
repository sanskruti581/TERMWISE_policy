/**
 * Executive Summary Utilities
 * 
 * Combines data logic with semantic framing for decision-first analysis.
 * These functions support the 5-section architecture with interpretation focus.
 */

import {
  getExposureFraming,
  getExposureLevel,
  prioritizeFindings,
  getMostImportantAreas,
  buildInterpretiveNarrative,
  generateContextCards,
  prioritizeClausesByImpact,
  getReviewAreaTitle,
  getFindingCategory,
  buildRecommendationGuidance,
  cleanSystemCentricText,
  explainClauseImplications
} from './semanticFraming.js';

// ============================================================================
// 1. FINDING FILTERING & PRIORITIZATION
// ============================================================================

/**
 * Pick top findings for "Key Review Areas" section (not "Top Risks")
 * Severity-first, not just first N
 */
export const pickTopFindings = (findings, maxCount = 4) => {
  if (!Array.isArray(findings)) return [];

  // Sort by severity first
  const sorted = [...findings].sort((a, b) => {
    const severityRank = (s) => {
      const v = String(s || '').toLowerCase();
      if (v.includes('critical')) return 4;
      if (v.includes('high')) return 3;
      if (v.includes('medium')) return 2;
      if (v.includes('low')) return 1;
      return 0;
    };
    return severityRank(b?.severity) - severityRank(a?.severity);
  });

  return sorted.slice(0, maxCount);
};

/**
 * Pick top clauses for "Important Clauses" section
 * Prioritize by severity, then deduplication
 */
export const pickTopClauses = (clauses, maxCount = 6) => {
  if (!Array.isArray(clauses)) return [];

  const sorted = [...clauses].sort((a, b) => {
    const severityRank = (s) => {
      const v = String(s || '').toLowerCase();
      if (v.includes('critical')) return 4;
      if (v.includes('high')) return 3;
      if (v.includes('medium')) return 2;
      if (v.includes('low')) return 1;
      return 0;
    };
    return severityRank(b?.severity) - severityRank(a?.severity);
  });

  // Deduplicate by sentence content
  const seen = new Set();
  const deduped = [];
  for (const clause of sorted) {
    const text = String(clause?.sentence || '').toLowerCase().trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      deduped.push(clause);
    }
  }

  return deduped.slice(0, maxCount);
};

/**
 * Pick top recommendations
 */
export const pickTopRecommendations = (recommendations, maxCount = 4) => {
  if (!Array.isArray(recommendations)) return [];
  return recommendations.filter(Boolean).slice(0, maxCount);
};

// ============================================================================
// 2. EXPOSURE-ORIENTED NARRATIVE
// ============================================================================

/**
 * Build opening paragraph that focuses on interpretation
 * NOT: "This is a Privacy Policy"
 * BUT: "This policy grants access to user location data..."
 */
export const buildOpeningNarrative = (analysis) => {
  if (!analysis) return '';

  return buildInterpretiveNarrative(analysis);
};

/**
 * Get exposure level with explanation
 */
export const getExposureAssessment = (analysis) => {
  const exposureLevel = getExposureLevel(analysis.score, analysis.documentDomain);
  const framing = getExposureFraming(analysis.documentDomain, analysis.documentSubtype);

  return {
    level: exposureLevel,
    framingLabel: framing.label,
    contextArea: framing.framingContext,
    concerns: framing.concerns.slice(0, 3)
  };
};

/**
 * Get "Most Important to Review" items
 */
export const getMostImportantItems = (analysis) => {
  return getMostImportantAreas(analysis).slice(0, 5);
};

// ============================================================================
// 3. SECTION TITLING (CONTEXT-AWARE, NOT GENERIC)
// ============================================================================

/**
 * Get appropriate title for findings section
 * Domain & severity aware
 */
export const getFindingsSectionTitle = (findings, documentDomain) => {
  return getReviewAreaTitle(findings, documentDomain);
};

// ============================================================================
// 4. CONTEXT CARD GENERATION
// ============================================================================

/**
 * Generate executive summary context cards
 */
export const getExecutiveContextCards = (analysis) => {
  return generateContextCards(analysis);
};

// ============================================================================
// 5. FINDING LABEL GENERATION
// ============================================================================

/**
 * Get human-readable label for a finding
 * NOT: "Theme: Penalty Clauses"
 * BUT: "Enforcement Conditions"
 */
export const findingToReadableLabel = (finding) => {
  if (!finding) return 'Important Finding';

  const framedLabel = getFindingCategory(finding);
  if (framedLabel && framedLabel !== 'Important Finding') return framedLabel;

  // Extract from description
  const desc = String(finding.description || finding.explanation || '').toLowerCase();
  if (desc.includes('penalty')) return 'Penalty Conditions';
  if (desc.includes('enforcement')) return 'Enforcement Mechanisms';
  if (desc.includes('termination')) return 'Termination Conditions';
  if (desc.includes('liability')) return 'Liability Exposure';
  if (desc.includes('data')) return 'Data Handling';
  if (desc.includes('obligation')) return 'Contractual Obligations';

  return label || 'Important Finding';
};

/**
 * Get brief detail text (truncated, readable)
 */
export const findingToDetailText = (finding, maxLen = 110) => {
  const text = cleanSystemCentricText(finding?.description || finding?.explanation || finding?.summary || 'Review this area for practical impact.')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
};

// ============================================================================
// 6. SEVERITY BADGE GENERATION
// ============================================================================

/**
 * Convert severity to badge label (consistent, human-readable)
 */
export const severityToLabel = (severity) => {
  const v = String(severity || '').toLowerCase();

  if (v.includes('critical')) return 'Critical';
  if (v.includes('high')) return 'High';
  if (v.includes('medium')) return 'Moderate';
  if (v.includes('low')) return 'Low';
  if (v.includes('safe')) return 'Minimal concern';

  return 'Review';
};

/**
 * Get severity badge color class
 */
export const severityToBgColor = (severity) => {
  const label = severityToLabel(severity);

  switch (label) {
    case 'Critical':
      return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
    case 'High':
      return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200';
    case 'Moderate':
      return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200';
    case 'Low':
      return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
    default:
      return 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200';
  }
};

// ============================================================================
// 7. CLAUSE PREPARATION FOR DISPLAY
// ============================================================================

/**
 * Prepare clause for display with all necessary context
 */
export const prepareClauseForDisplay = (clause, index) => {
  return {
    id: clause?.id || `clause-${index}`,
    sentence: clause?.sentence || clause?.text || '',
    explanation: clause?.explanation || explainClauseImplications(clause) || '',
    implication: explainClauseImplications(clause),
    severity: severityToLabel(clause?.severity),
    severityColor: severityToBgColor(clause?.severity),
    evidence: Array.isArray(clause?.evidence) ? clause.evidence.slice(0, 2).map(formatEvidenceForDisplay) : [],
    category: clause?.category || clause?.label || 'Clause'
  };
};

export const formatEvidenceForDisplay = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item !== 'object') return String(item);

  const snippet = String(item.snippet || item.text || item.sentence || '').trim();
  const locationParts = [
    item.page ? `page ${item.page}` : '',
    item.paragraphIndex !== undefined ? `paragraph ${Number(item.paragraphIndex) + 1}` : '',
    item.sectionIndex !== undefined ? `section ${Number(item.sectionIndex) + 1}` : ''
  ].filter(Boolean);

  if (snippet && locationParts.length) return `${snippet} (${locationParts.join(', ')})`;
  if (snippet) return snippet;
  if (locationParts.length) return `Evidence source: ${locationParts.join(', ')}`;
  if (item.evidenceSource) return `Evidence source: ${item.evidenceSource}`;
  if (item.triggerType) return `Evidence type: ${item.triggerType}`;

  return 'Linked source evidence';
};

// ============================================================================
// 8. RECOMMENDATION PREPARATION
// ============================================================================

/**
 * Prepare recommendation for display
 */
export const prepareRecommendationForDisplay = (rec) => {
  return {
    text: buildRecommendationGuidance(rec),
    originalText: rec?.text || rec || '',
    triggeringClause: rec?.triggeringClause || 'Analysis finding',
    location: rec?.location || '',
    severity: rec?.severity || 'Medium',
    relevance: rec?.relevance || 0,
    evidence: Array.isArray(rec?.evidence) ? rec.evidence.slice(0, 3).map(formatEvidenceForDisplay) : [],
    category: rec?.category || ''
  };
};

// ============================================================================
// 9. DOCUMENT CLASSIFICATION SUMMARY
// ============================================================================

/**
 * Get summary text for what document IS (not jargony)
 */
export const getDocumentTypeExplanation = (documentType, documentSubtype) => {
  const type = String(documentType || '').toLowerCase();

  if (type.includes('privacy')) {
    return 'This is a privacy policy that describes data collection, use, and sharing practices.';
  }

  if (type.includes('loan') || type.includes('financial')) {
    return 'This is a financial agreement that establishes borrower obligations and repayment terms.';
  }

  if (type.includes('employment')) {
    return 'This is an employment agreement that outlines workplace obligations and conditions.';
  }

  if (type.includes('vendor') || type.includes('procurement')) {
    return 'This is a vendor agreement that establishes operational and compliance requirements.';
  }

  if (type.includes('service')) {
    return 'This is a service agreement that defines service delivery terms and responsibilities.';
  }

  if (type.includes('terms')) {
    return 'This is a terms of service agreement that establishes user restrictions and platform rights.';
  }

  return `This is a ${documentType || 'legal document'}.`;
};

// ============================================================================
// 10. EMPTY STATE MESSAGING
// ============================================================================

/**
 * Get appropriate empty-state message based on section
 */
export const getEmptyStateMessage = (section, documentDomain) => {
  const messages = {
    findings: 'No major findings highlighted in this document.',
    clauses: 'No high-impact clauses detected.',
    recommendations: 'No specific recommendations at this time.',
    advanced: 'Limited advanced analysis data available.'
  };

  return messages[section] || 'No data available.';
};
