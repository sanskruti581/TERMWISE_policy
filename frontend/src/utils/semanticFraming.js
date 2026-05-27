/**
 * Semantic Framing Utilities
 * 
 * Transforms classification output into human-readable legal interpretation.
 * Focuses on: what findings MEAN, not what they ARE.
 * 
 * Core principles:
 * - Interpretation-first, not classification-first
 * - Domain-aware exposure language
 * - Severity-based prioritization
 * - Executive-friendly narrative
 */

// ============================================================================
// 1. DOMAIN-AWARE EXPOSURE FRAMING
// ============================================================================

/**
 * Get domain-appropriate exposure terminology
 * Replaces generic "risk" with contextual language
 */
export const getExposureFraming = (documentDomain, documentSubtype) => {
  const domain = String(documentDomain || '').toLowerCase();
  const subtype = String(documentSubtype || '').toLowerCase();

  // Privacy-focused documents
  if (domain.includes('privacy') || domain.includes('data')) {
    return {
      label: 'Privacy Exposure',
      framingContext: 'data handling, user consent, and tracking practices',
      keyTerms: ['data collection', 'third-party sharing', 'tracking', 'retention', 'consent'],
      concerns: ['user data exposure', 'tracking mechanisms', 'data retention periods', 'third-party access']
    };
  }

  // Financial agreements
  if (domain.includes('loan') || domain.includes('financial') || domain.includes('payment')) {
    return {
      label: 'Borrower/Financial Exposure',
      framingContext: 'repayment obligations, penalties, and financial liability',
      keyTerms: ['penalties', 'interest rates', 'repayment', 'collateral', 'default'],
      concerns: ['repayment burden', 'penalty conditions', 'financial liability', 'default triggers']
    };
  }

  // Employment agreements
  if (domain.includes('employment') || domain.includes('employee')) {
    return {
      label: 'Workplace Obligation Exposure',
      framingContext: 'employee restrictions, duties, and termination conditions',
      keyTerms: ['restrictions', 'non-compete', 'termination', 'obligations', 'duties'],
      concerns: ['employment restrictions', 'termination clauses', 'workplace obligations', 'enforceability']
    };
  }

  // Vendor/procurement contracts
  if (domain.includes('vendor') || domain.includes('procurement') || domain.includes('procurement')) {
    return {
      label: 'Operational Compliance Exposure',
      framingContext: 'vendor obligations, compliance requirements, and enforcement mechanisms',
      keyTerms: ['compliance', 'performance', 'standards', 'penalties', 'enforcement'],
      concerns: ['compliance burden', 'performance standards', 'penalty escalation', 'enforcement conditions']
    };
  }

  // Service agreements
  if (domain.includes('service') || domain.includes('provider')) {
    return {
      label: 'Service Obligation Exposure',
      framingContext: 'service delivery terms, performance standards, and liability',
      keyTerms: ['service levels', 'performance', 'liability', 'warranties', 'indemnification'],
      concerns: ['service obligations', 'performance standards', 'liability limits', 'termination rights']
    };
  }

  // Terms of Service / user agreements
  if (domain.includes('terms') || domain.includes('user')) {
    return {
      label: 'User Obligation Exposure',
      framingContext: 'user restrictions, platform rights, and content liability',
      keyTerms: ['restrictions', 'acceptable use', 'liability', 'termination', 'rights'],
      concerns: ['user restrictions', 'platform enforcement', 'liability exposure', 'termination conditions']
    };
  }

  // Generic fallback
  return {
    label: 'Document Exposure',
    framingContext: 'legal and operational exposure areas',
    keyTerms: ['obligations', 'restrictions', 'enforcement', 'liability'],
    concerns: ['operational exposure', 'legal obligations', 'enforcement mechanisms', 'liability']
  };
};

// ============================================================================
// 2. EXPOSURE LEVEL LANGUAGE (NOT BINARY)
// ============================================================================

/**
 * Convert score to exposure level (not "Safe/Dangerous")
 * Focuses on pragmatic impact, not fear
 */
export const getExposureLevel = (score, documentDomain) => {
  const s = typeof score === 'number' ? score : Number(score);
  const domain = String(documentDomain || '').toLowerCase();
  
  if (!Number.isFinite(s)) return 'Unknown Exposure';

  if (domain.includes('privacy') || domain.includes('data')) {
    if (s >= 80) return 'High Privacy Exposure';
    if (s >= 65) return 'Elevated Privacy Concern';
    if (s >= 50) return 'Moderate Data Handling Concern';
    if (s >= 25) return 'Low Privacy Concern';
    return 'Minimal Privacy Concern';
  }

  if (domain.includes('loan') || domain.includes('financial') || domain.includes('payment')) {
    if (s >= 80) return 'High Consumer Financial Exposure';
    if (s >= 65) return 'Elevated Repayment Burden';
    if (s >= 50) return 'Moderate Financial Obligation';
    if (s >= 25) return 'Low Financial Exposure';
    return 'Minimal Consumer Harm';
  }

  if (domain.includes('procurement') || domain.includes('vendor') || domain.includes('service')) {
    if (s >= 80) return 'High Enforcement Burden';
    if (s >= 65) return 'Elevated Enforcement Burden';
    if (s >= 50) return 'Moderate Operational Exposure';
    if (s >= 25) return 'Limited Operational Exposure';
    return 'Minimal Operational Concern';
  }

  if (s >= 80) return 'High Enforcement Severity';
  if (s >= 65) return 'Elevated Enforcement Burden';
  if (s >= 50) return 'Moderate Operational Exposure';
  if (s >= 25) return 'Limited Review Concern';
  return 'Minimal Consumer Harm';
};

/**
 * Get exposure level description/rationale
 */
export const getExposureLevelExplanation = (score, documentDomain) => {
  const s = typeof score === 'number' ? score : Number(score);
  const domain = String(documentDomain || '').toLowerCase();

  if (domain.includes('privacy') || domain.includes('data')) {
    if (s >= 65) return 'Data practices, retention, sharing, or consent terms deserve focused review before acceptance.';
    if (s >= 25) return 'Some privacy-related provisions should be checked for user control and third-party access.';
    return 'The detected privacy language suggests limited concern, with standard review still appropriate.';
  }

  if (domain.includes('loan') || domain.includes('financial') || domain.includes('payment')) {
    if (s >= 65) return 'Repayment terms, default triggers, penalties, or collection authority require careful review.';
    if (s >= 25) return 'Financial duties appear limited, but payment timing and default consequences should still be verified.';
    return 'The detected financial burden appears limited, with routine review of payment duties recommended.';
  }

  if (domain.includes('procurement') || domain.includes('vendor') || domain.includes('service')) {
    if (s >= 65) return 'Operational duties, compliance standards, penalties, or termination authority require focused review.';
    if (s >= 25) return 'The agreement creates manageable operational obligations that should be checked against delivery capacity.';
    return 'The detected operational burden appears limited, with routine review of enforceable duties recommended.';
  }

  if (s >= 80) 
    return 'Multiple significant enforcement or obligation findings warrant careful review before committing to this document.';
  if (s >= 65) 
    return 'Several important obligations or enforcement terms require attention before acceptance.';
  if (s >= 50) 
    return 'Standard review recommended; some clauses may benefit from negotiation.';
  if (s >= 25) 
    return 'Limited key findings; document appears relatively straightforward for review.';
  return 'Minimal findings detected; document appears to present limited concerns.';
};

// ============================================================================
// 3. FINDING PRIORITIZATION (NOT JUST GROUPING)
// ============================================================================

/**
 * Prioritize findings by severity + impact
 * Returns: Critical, Important, Additional Context
 */
export const prioritizeFindings = (findings) => {
  if (!Array.isArray(findings)) return { critical: [], important: [], additional: [] };

  const critical = [];
  const important = [];
  const additional = [];

  findings.forEach(f => {
    const severity = String(f?.severity || 'low').toLowerCase();
    const hasEnforcement = String(f?.explanation || f?.description || '')
      .toLowerCase()
      .match(/penalty|termination|enforce|breach|default|liable/);

    if (severity.includes('critical') || hasEnforcement) {
      critical.push(f);
    } else if (severity.includes('high') || severity.includes('medium')) {
      important.push(f);
    } else {
      additional.push(f);
    }
  });

  return { critical, important, additional };
};

/**
 * Get finding category label (not "Risk")
 * Examples: Enforcement Condition, Obligation, Restriction, etc.
 */
export const getFindingCategory = (finding, documentDomain) => {
  const text = String(finding?.category || finding?.label || finding?.explanation || '').toLowerCase();
  const domain = String(documentDomain || '').toLowerCase();

  // Enforcement-related
  if (text.match(/penalty|termination|enforce|breach|default|liable/)) {
    return 'Enforcement Condition';
  }

  // Obligation-related
  if (text.match(/obligation|duty|require|must|shall/)) {
    return 'Operational Obligation';
  }

  // Restriction-related
  if (text.match(/restrict|prohibit|forbidden|cannot|may not/)) {
    return 'Contractual Restriction';
  }

  // Data/privacy-related
  if (text.match(/data|privacy|tracking|collect|share|personal/)) {
    return 'Data & Privacy Concern';
  }

  // Financial-related
  if (text.match(/payment|cost|fee|liable|loss|damage|indemnif/)) {
    return 'Financial Liability';
  }

  // Termination-related
  if (text.match(/terminat|cancel|end|exit|expir/)) {
    return 'Termination Condition';
  }

  return 'Important Finding';
};

export const cleanSystemCentricText = (value) => {
  return String(value || '')
    .replace(/\b\d+\s+(risk|risks|categories|clauses|themes|findings)\s+(detected|found|identified)\b/gi, 'important review areas were identified')
    .replace(/\brisk score\b/gi, 'exposure assessment')
    .replace(/\brisk level\b/gi, 'exposure level')
    .replace(/\brisk categories\b/gi, 'review areas')
    .replace(/\brisk breakdown\b/gi, 'review breakdown')
    .replace(/\bsafe\b/gi, 'minimal concern')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isSystemCentricText = (value) => {
  const text = String(value || '').toLowerCase();
  return /\b\d+\s+(risks?|categories|clauses|themes)\b/.test(text) ||
    text.includes('risk score') ||
    text.includes('semantic') ||
    text.includes('confidence');
};

const getReadableFinding = (finding) => {
  return String(finding?.category || finding?.label || finding?.description || finding?.explanation || '').toLowerCase();
};

export const buildNarrativeFromFindings = ({ domain, topRisks }) => {
  const labels = topRisks.map(getReadableFinding).filter(Boolean).join(' ');
  const hasEnforcement = /penalt|terminat|breach|default|enforce|violat|remed/.test(labels);
  const hasPayment = /payment|fee|repay|borrow|interest|financial|cost|charge/.test(labels);
  const hasPrivacy = /data|privacy|collect|share|tracking|retention|consent|personal/.test(labels);
  const hasObligation = /obligation|comply|shall|must|required|standard|duty/.test(labels);

  if (domain.includes('privacy') || hasPrivacy) {
    return 'This document creates data-handling obligations and may allow collection, retention, or sharing of user information. Review consent, third-party access, retention limits, and user control provisions first.';
  }

  if (domain.includes('loan') || domain.includes('financial') || hasPayment) {
    if (hasEnforcement) {
      return 'This agreement combines payment duties with enforcement consequences. Review repayment timing, default triggers, penalties, and whether missed obligations allow accelerated collection or termination.';
    }
    return 'This agreement establishes financial obligations. Review who pays, when payment is due, how charges can change, and what happens if payment is delayed.';
  }

  if (hasEnforcement && hasObligation) {
    return 'This document gives contractual obligations practical force through enforcement mechanisms. Review the duties imposed, the consequences for repeated violations, and any unilateral termination authority.';
  }

  if (hasEnforcement) {
    return 'This document contains enforcement mechanisms that may affect termination, penalties, remedies, or liability. Review when those powers can be used and whether the trigger language is narrow enough.';
  }

  if (hasObligation) {
    return 'This document is primarily obligation-driven. Review the required duties, compliance standards, deadlines, and whether non-compliance creates financial or operational consequences.';
  }

  return 'This document establishes legal obligations and review areas. Focus first on clauses that assign duties, shift responsibility, or give one party authority to enforce the agreement.';
};

// ============================================================================
// 4. NARRATIVE INTERPRETATION (NOT CLASSIFICATION)
// ============================================================================

/**
 * Build executive summary narrative that interprets what the document means
 * NOT: "This is a Privacy Policy"
 * BUT: "This policy grants third parties access to user location data..."
 */
export const buildInterpretiveNarrative = (analysis) => {
  if (!analysis) return '';

  const domain = String(analysis.documentDomain || analysis.documentType || '').toLowerCase();
  const topRisks = Array.isArray(analysis.risks) ? analysis.risks.slice(0, 3) : [];
  const summary = cleanSystemCentricText(analysis.summary);
  const semanticNarrative = String(analysis.semanticNarrative || '').trim();

  // Use backend-provided summary if available and meaningful
  if (summary && summary.length > 20 && !isSystemCentricText(summary)) {
    return summary;
  }

  // Build from semantic narrative if available
  if (semanticNarrative && semanticNarrative.length > 20 && !isSystemCentricText(semanticNarrative)) {
    return cleanSystemCentricText(semanticNarrative);
  }

  // Build interpretation from top findings
  if (topRisks.length === 0) {
    if (domain.includes('privacy')) {
      return 'This privacy policy defines how user data may be collected, processed, retained, or shared. Review whether the data practices match the user relationship and consent expectations.';
    }
    if (domain.includes('loan') || domain.includes('financial')) {
      return 'This agreement establishes borrower repayment duties and financial consequences. Review payment timing, default triggers, and penalty escalation before relying on the terms.';
    }
    if (domain.includes('employment')) {
      return 'This agreement outlines workplace duties, restrictions, and termination conditions. Review where the employer receives discretion to enforce or end the relationship.';
    }
    return 'This document establishes legal obligations and enforcement terms. Review the clauses that give one party authority, impose duties, or create financial consequences.';
  }

  // Build narrative from findings
  const findingLabels = topRisks
    .map(r => String(r?.category || r?.label || '').toLowerCase())
    .filter(Boolean);

  if (domain.includes('privacy')) {
    const hasTracking = findingLabels.some(l => l.includes('track'));
    const hasSharing = findingLabels.some(l => l.includes('shar'));
    if (hasTracking || hasSharing) {
      return 'This privacy policy includes tracking mechanisms and grants data access to third parties. Review data handling practices carefully.';
    }
  }

  if (domain.includes('loan') || domain.includes('financial')) {
    const hasPenalty = findingLabels.some(l => l.includes('penalty'));
    const hasDefault = findingLabels.some(l => l.includes('default'));
    if (hasPenalty || hasDefault) {
      return 'This agreement establishes financial penalties and default conditions. Repayment obligations require careful attention.';
    }
  }

  if (domain.includes('employment')) {
    const hasTermination = findingLabels.some(l => l.includes('terminat'));
    const hasRestriction = findingLabels.some(l => l.includes('restrict'));
    if (hasTermination || hasRestriction) {
      return 'This agreement includes employment restrictions and termination conditions. Review enforcement mechanisms thoroughly.';
    }
  }

  return buildNarrativeFromFindings({ domain, topRisks });
};

// ============================================================================
// 5. PRIORITY AREAS IDENTIFICATION
// ============================================================================

/**
 * Identify "Most Important to Review" areas
 * Returns 3-5 specific, actionable items user should review first
 */
export const getMostImportantAreas = (analysis) => {
  const areas = [];
  const findings = Array.isArray(analysis.risks) ? analysis.risks : [];
  const domain = String(analysis.documentDomain || '').toLowerCase();

  // Collect high-impact findings
  const critical = findings.filter(f => 
    String(f?.severity || '').toLowerCase().includes('critical') ||
    String(f?.severity || '').toLowerCase().includes('high')
  );

  // Add penalty/enforcement findings
  const enforcement = findings.filter(f =>
    String(f?.category || '').toLowerCase().match(/penalty|enforcement|breach|default|terminate/)
  );

  // Add obligation findings
  const obligations = findings.filter(f =>
    String(f?.category || '').toLowerCase().match(/obligation|duty|require|compliance/)
  );

  // Build priority list
  critical.slice(0, 2).forEach(f => {
    if (f?.category) areas.push(toActionableReviewArea(f));
  });

  enforcement.slice(0, 2).forEach(f => {
    const area = toActionableReviewArea(f);
    if (f?.category && !areas.includes(area)) areas.push(area);
  });

  obligations.slice(0, 2).forEach(f => {
    const area = toActionableReviewArea(f);
    if (f?.category && !areas.includes(area)) areas.push(area);
  });

  // Domain-specific additions
  if (domain.includes('privacy')) {
    if (!areas.some(a => a.toLowerCase().includes('data'))) {
      areas.push('Data retention and sharing practices');
    }
  }

  if (domain.includes('loan') || domain.includes('financial')) {
    if (!areas.some(a => a.toLowerCase().includes('repay'))) {
      areas.push('Repayment schedule and penalties');
    }
  }

  if (domain.includes('employment')) {
    if (!areas.some(a => a.toLowerCase().includes('terminat'))) {
      areas.push('Termination conditions and restrictions');
    }
  }

  return areas.slice(0, 5);
};

export const toActionableReviewArea = (finding) => {
  const text = String(finding?.category || finding?.description || finding?.explanation || '').toLowerCase();

  if (/penalt|fine|sanction|violat/.test(text)) return 'Penalty escalation and violation consequences';
  if (/terminat|cancel|end/.test(text)) return 'Termination authority and trigger conditions';
  if (/default|repay|payment|fee|interest|borrow/.test(text)) return 'Payment duties, default triggers, and repayment burden';
  if (/data|privacy|collect|share|tracking|retention|consent/.test(text)) return 'Data collection, sharing, retention, and consent controls';
  if (/liab|indemn|damage|loss/.test(text)) return 'Liability allocation and indemnity obligations';
  if (/comply|compliance|obligation|shall|must|required/.test(text)) return 'Operational obligations and compliance burden';
  if (/restrict|prohibit|shall not|may not/.test(text)) return 'Contractual restrictions and prohibited conduct';

  return finding?.category || 'Important contractual review area';
};

// ============================================================================
// 6. SEVERITY-BASED CLAUSE SORTING
// ============================================================================

/**
 * Sort clauses by severity FIRST, then by category
 * Returns: { critical: [], important: [], additional: [] }
 */
export const prioritizeClausesByImpact = (clauses) => {
  if (!Array.isArray(clauses)) return { critical: [], important: [], additional: [] };

  const severityRank = (s) => {
    const v = String(s || '').toLowerCase();
    if (v.includes('critical')) return 4;
    if (v.includes('high')) return 3;
    if (v.includes('medium')) return 2;
    if (v.includes('low')) return 1;
    return 0;
  };

  const sorted = [...clauses].sort((a, b) => severityRank(b?.severity) - severityRank(a?.severity));

  const critical = sorted.filter(c => severityRank(c?.severity) >= 3);
  const important = sorted.filter(c => severityRank(c?.severity) === 2);
  const additional = sorted.filter(c => severityRank(c?.severity) <= 1);

  return { critical, important, additional };
};

// ============================================================================
// 7. REVIEW AREA NAMING (NOT "TOP RISKS")
// ============================================================================

/**
 * Get appropriate section title based on findings
 * NOT: "Top Risks"
 * BUT: context-aware naming
 */
export const getReviewAreaTitle = (findings, documentDomain) => {
  if (!Array.isArray(findings) || findings.length === 0) {
    return 'Key Review Areas';
  }

  const domain = String(documentDomain || '').toLowerCase();
  const hasEnforcement = findings.some(f =>
    String(f?.category || '').toLowerCase().match(/penalty|enforcement|breach|default/)
  );
  const hasObligation = findings.some(f =>
    String(f?.category || '').toLowerCase().match(/obligation|duty|requirement|compliance/)
  );

  if (domain.includes('privacy')) {
    return 'Data & Privacy Review Areas';
  }

  if (domain.includes('employment')) {
    return 'Employment Terms Review';
  }

  if (domain.includes('loan') || domain.includes('financial')) {
    if (hasEnforcement) return 'Financial Obligations & Penalties';
    return 'Repayment Terms & Conditions';
  }

  if (hasEnforcement) {
    return 'Enforcement Conditions';
  }

  if (hasObligation) {
    return 'Contractual Obligations';
  }

  return 'Key Review Areas';
};

// ============================================================================
// 8. CLAUSE CONTEXT EXPLANATION (NOT JUST "CLAUSE TEXT")
// ============================================================================

/**
 * Add contextual explanation to a clause
 * Explains WHY it matters, not just WHAT it says
 */
export const explainClauseImplications = (clause, documentDomain) => {
  const text = String(clause?.sentence || clause?.text || '').toLowerCase();
  const domain = String(documentDomain || '').toLowerCase();

  // Penalty clause implications
  if (text.includes('penalty') || text.includes('fee')) {
    return 'This clause defines financial consequences for violations or non-performance.';
  }

  // Termination implications
  if (text.includes('termin') || text.includes('cancel')) {
    return 'This clause establishes conditions under which either party can end the agreement.';
  }

  // Data access implications
  if (text.includes('data') || text.includes('personal')) {
    return 'This clause governs how your information is accessed, used, or shared.';
  }

  // Restriction implications
  if (text.includes('shall not') || text.includes('prohibited')) {
    return 'This clause restricts specific actions or behaviors.';
  }

  // Liability limitation
  if (text.includes('liable') || text.includes('indemnif')) {
    return 'This clause limits legal responsibility for potential damages.';
  }

  // Obligation implications
  if (text.includes('must') || text.includes('shall') || text.includes('require')) {
    return 'This clause establishes mandatory requirements or duties.';
  }

  return null;
};

export const buildRecommendationGuidance = (rec, analysis = {}) => {
  const text = String(rec?.text || rec || '').replace(/^\w+:\s*/, '').trim();
  const clause = String(rec?.triggeringClause || '').toLowerCase();
  const category = String(rec?.category || text).toLowerCase();
  const combined = `${text} ${clause} ${category}`.toLowerCase();

  if (/penalt|fine|sanction|violat/.test(combined)) {
    return 'Check whether repeated violations increase financial penalties, trigger other remedies, or allow one party to terminate the agreement.';
  }
  if (/terminat|cancel|end/.test(combined)) {
    return 'Verify who can terminate, what notice is required, and whether termination can occur unilaterally after operational issues.';
  }
  if (/payment|repay|fee|interest|default|borrow/.test(combined)) {
    return 'Confirm the payment schedule, default consequences, late fees, and whether missed payments accelerate remaining obligations.';
  }
  if (/data|privacy|collect|share|tracking|retention|consent/.test(combined)) {
    return 'Verify what data is collected, who receives it, how long it is retained, and whether consent or opt-out rights are clearly stated.';
  }
  if (/liab|indemn|damage|loss|warranty/.test(combined)) {
    return 'Review whether liability is capped, shifted, or excluded, and whether indemnity language creates one-sided responsibility.';
  }
  if (/comply|compliance|obligation|shall|must|required|standard/.test(combined)) {
    return 'Confirm the required operational duties, who monitors compliance, and what happens when the standard is not met.';
  }

  const domain = String(analysis.documentDomain || analysis.documentType || '').toLowerCase();
  if (domain.includes('privacy')) {
    return 'Review whether this provision changes user control, data access, retention, or third-party sharing expectations.';
  }
  if (domain.includes('financial') || domain.includes('loan')) {
    return 'Review whether this provision changes payment burden, default consequences, or collection authority.';
  }

  return text || 'Review the linked clause for practical obligations, enforcement authority, and negotiation impact.';
};

// ============================================================================
// 9. CONTEXT CARD GENERATION (FOR EXECUTIVE SUMMARY)
// ============================================================================

/**
 * Generate smart context cards for executive summary
 * Replaces generic "Document Type" with meaningful context
 */
export const generateContextCards = (analysis) => {
  const domain = String(analysis.documentDomain || analysis.documentType || '').toLowerCase();
  const score = analysis.score || 0;
  const exposure = getExposureLevel(score, domain);

  return {
    whatIsThis: {
      label: 'What is this?',
      content: analysis.documentType || 'Document',
      detail: analysis.documentSubtype && analysis.documentSubtype !== analysis.documentType
        ? analysis.documentSubtype
        : null
    },
    howConcerning: {
      label: 'Exposure level?',
      content: exposure,
      detail: getExposureLevelExplanation(score, domain)
    },
    mainAreas: {
      label: 'Important to review:',
      content: getMostImportantAreas(analysis)
    },
    whatFirst: {
      label: 'Start with:',
      content: analysis.summary || 'Review the Important Clauses section.',
      isRecommendation: true
    }
  };
};
