const themePhraseMap = {
  commercial: 'commercial sales and service obligations',
  payment: 'payment and billing requirements',
  liability: 'warranty limitations and liability protections',
  indemnification: 'indemnification and third-party claim protections',
  termination: 'termination conditions and survival obligations',
  confidentiality: 'confidentiality and non-disclosure provisions',
  export: 'export controls and trade restrictions',
  governingLaw: 'governing law and jurisdiction terms',
  disputeResolution: 'dispute resolution processes',
  intellectualProperty: 'intellectual property and licensing terms',
  forceMajeure: 'force majeure relief',
  delivery: 'delivery, acceptance, and timing responsibilities',
  compliance: 'compliance obligations and regulatory controls',
  operational: 'operational responsibilities and service requirements',
  privacy: 'privacy and data protection references',
  researchFunding: 'research funding and sponsor obligations'
};

const joinNatural = (items) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const buildSemanticNarrative = (themeDominance = []) => {
  const topThemes = themeDominance
    .filter((theme) => theme.share >= 0.04)
    .slice(0, 5)
    .map((theme) => themePhraseMap[theme.key] || theme.label.toLowerCase());

  if (!topThemes.length) return 'The document contains mixed legal and operational language with no single dominant semantic theme.';
  if (topThemes.length === 1) return `This document is primarily focused on ${topThemes[0]}.`;
  return `This document primarily defines ${joinNatural(topThemes)}.`;
};

const buildSuppressedCategories = (context, themeSummary) => {
  const suppressed = Array.isArray(context.signals) ? context.signals.filter((signal) => signal.suppressionReason) : [];
  const weakDomains = themeSummary?.weakDomains || [];
  const isolatedThemes = themeSummary?.semanticIsolation?.suppressedThemes || [];

  return [
    ...suppressed.map((signal) => ({
      label: signal.label,
      category: signal.category,
      reason: signal.suppressionReason,
      influence: signal.proportionalInfluence || signal.adjustedWeight || 0
    })),
    ...weakDomains.map((domain) => ({
      label: domain.label,
      category: domain.key,
      reason: `${domain.label} was treated as supporting context because it represents ${Math.round(domain.share * 100)}% of domain influence.`,
      influence: domain.share
    })),
    ...isolatedThemes.map((theme) => ({
      label: theme.label,
      category: theme.key,
      reason: theme.reason,
      influence: theme.share
    }))
  ];
};

export const buildSemanticExplanation = ({ classification, context, themeSummary, subtype, detectedRisks, positiveIndicators }) => {
  const strongSignals = Array.isArray(context.signals)
    ? context.signals.slice(0, 6).map((signal) => ({
        label: signal.label,
        category: signal.category,
        confidence: signal.adjustedConfidence ?? signal.semanticConfidence ?? signal.confidence,
        occurrences: signal.occurrences,
        dominance: signal.dominance,
        sectionWeight: signal.sectionWeight || 0,
        domainDominance: signal.domainDominance || signal.domainInfluence || 0,
        suppressionFactor: signal.suppressionFactor || 1,
        proportionalInfluence: signal.proportionalInfluence || signal.adjustedWeight || 0,
        suppressionReason: signal.suppressionReason || null
      }))
    : [];

  const rankedThemes = Array.isArray(themeSummary?.themeDominance)
    ? themeSummary.themeDominance.slice(0, 7).map((theme) => `${theme.label} (${Math.round(theme.share * 100)}%)`)
    : [];

  const privacyShare = themeSummary?.themeDominance?.find((item) => item.key === 'privacy')?.share || 0;
  const domainLabel = themeSummary?.dominantDomain?.label || subtype?.documentDomain || classification.documentType || 'Legal documents';
  const narrative = buildSemanticNarrative(themeSummary?.themeDominance || []);
  const suppressedCategories = buildSuppressedCategories(context, themeSummary);

  const conclusion = `The document is classified as ${subtype?.documentSubtype || classification.documentType}. It most strongly aligns with ${domainLabel}. ${privacyShare < 0.18 ? `Privacy references account for ${Math.round(privacyShare * 100)}% of semantic influence, so they remain supporting signals.` : 'Privacy and data protection language is a meaningful part of the text.'}`;

  const evidence = strongSignals.map((signal) => `${signal.label} (${signal.occurrences} matches, ${Math.round((signal.confidence ?? 0) * 100)}% confidence)`);

  const confidenceReasoning = strongSignals.map((signal) => ({
    label: signal.label,
    formula: 'localMatch x sectionWeight x domainDominance x suppressionFactor',
    localMatch: Number((signal.proportionalInfluence || 0).toFixed(2)),
    sectionWeight: signal.sectionWeight,
    domainDominance: signal.domainDominance,
    suppressionFactor: signal.suppressionFactor,
    finalConfidence: signal.confidence
  }));

  const riskSummary = detectedRisks.length
    ? `Detected ${detectedRisks.length} risk categories with clause evidence while semantic domain analysis remains the primary guide for classification.`
    : 'No major rule-based privacy risks were detected; the document appears focused on legal, commercial, or operational themes.';

  return {
    semanticNarrative: narrative,
    classificationReasoning: {
      strongSignals,
      rankedThemes,
      weightedSections: strongSignals.map((signal) => ({
        label: signal.label,
        sectionWeight: signal.sectionWeight,
        dominance: signal.dominance
      })),
      semanticDominance: themeSummary?.themeDominance || [],
      suppressedCategories,
      semanticIsolation: themeSummary?.semanticIsolation || null,
      contextualReasoning: `Semantic balancing used the dominant ${themeSummary?.semanticIsolation?.domainKey || 'document'} context to reduce weak cross-domain signals before confidence scoring.`,
      confidenceReasoning,
      conclusion,
      evidence,
      riskSummary,
      positiveIndicators: positiveIndicators.map((indicator) => ({
        label: indicator.label,
        reduction: indicator.reduction,
        matches: indicator.matches?.slice(0, 3) || []
      }))
    }
  };
};
