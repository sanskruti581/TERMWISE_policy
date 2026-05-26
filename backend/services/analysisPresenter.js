const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const REPORT_ARTIFACT_PATTERN = /^(termswise analysis report|risk score|privacy grade|risk level|created|summary|detected risks|highlighted clauses|recommendations|positive indicators|category|severity)\s*:?/i;
const SCORE_FRAGMENT_PATTERN = /^\d{1,3}\s*\/\s*100\b/i;
const CATEGORY_PREFIX_PATTERN = /^(data selling|biometric collection|third-party sharing and marketing partners|third-party data sharing|location tracking|cookies and advertising tracking|cookies and tracking|permanent data retention|weak user consent)\s*:?\s+/i;
const MAX_HIGHLIGHT_LENGTH = 320;

const toPlain = (analysis) => {
  if (!analysis) return null;
  return typeof analysis.toObject === 'function' ? analysis.toObject() : analysis;
};

const cleanText = (value) =>
  String(value || '')
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^#{1,6}\s*/g, '')
    .replace(/^[-*•]\s*/g, '')
    .replace(CATEGORY_PREFIX_PATTERN, '')
    .replace(/\*\*/g, '')
    .replace(/^(recommendation|recommendations|summary|detected risks|risk score|privacy grade|risk level)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const compactHighlightSentence = (value) => {
  const rawSentence = String(value || '').trim();
  if (REPORT_ARTIFACT_PATTERN.test(rawSentence) || SCORE_FRAGMENT_PATTERN.test(rawSentence)) return '';

  const sentence = cleanText(value);
  if (!sentence || REPORT_ARTIFACT_PATTERN.test(sentence) || SCORE_FRAGMENT_PATTERN.test(sentence)) return '';

  const parts = sentence.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(cleanText).filter(Boolean) || [sentence];
  const compact = parts.slice(0, 2).join(' ');

  if (compact.length <= MAX_HIGHLIGHT_LENGTH) return compact;
  const boundary = compact.lastIndexOf(' ', MAX_HIGHLIGHT_LENGTH);
  return `${compact.slice(0, boundary > 180 ? boundary : MAX_HIGHLIGHT_LENGTH).trim()}...`;
};

const normalizeHighlight = (highlight) => {
  if (!highlight || typeof highlight !== 'object') return null;

  const category = cleanText(highlight.category);
  const severity = cleanText(highlight.severity || 'Moderate');
  const sentence = compactHighlightSentence(highlight.sentence);
  const intentTypes = Array.isArray(highlight.intentTypes) ? highlight.intentTypes.map(cleanText).filter(Boolean) : [];

  if (!category || !sentence) return null;

  return {
    category,
    severity,
    sentence,
    intentTypes,
    clauseType: cleanText(highlight.clauseType),
    sensitivity: cleanText(highlight.sensitivity),
    explanation: cleanText(highlight.explanation),
    badges: Array.isArray(highlight.badges) ? highlight.badges.map(cleanText).filter(Boolean) : [],
    dimensions: highlight.dimensions || null
  };
};

export const presentAnalysis = (analysis) => {
  const item = toPlain(analysis);
  const risks = uniqueBy(item.detectedRisks || [], (risk) => risk.category).map((risk) => ({
    category: risk.category,
    severity: risk.severity,
    points: risk.points,
    matches: [...new Set(risk.matches || [])]
  }));

  const highlights = uniqueBy(
    (item.highlightedClauses || []).map(normalizeHighlight).filter(Boolean),
    (highlight) => highlight.sentence.toLowerCase()
  ).slice(0, 8);

  return {
    id: item._id?.toString(),
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    score: item.riskScore,
    grade: item.privacyGrade,
    riskLevel: item.riskLevel,
    adaptiveRiskProfile: item.adaptiveRiskProfile || null,
    documentType: item.documentType,
    documentTypeConfidence: item.documentTypeConfidence,
    documentDomain: item.documentDomain || item.documentType || 'Unknown',
    documentDomainConfidence: Number(item.documentDomainConfidence || 0),
    documentSubtype: item.documentSubtype || item.documentType || 'Unknown',
    documentSubtypeConfidence: Number(item.documentSubtypeConfidence || 0),
    analysisConfidence: item.analysisConfidence,
    analysisReliability: item.analysisReliability || item.analysisConfidence,
    analysisReliabilityScore: Number(item.analysisReliabilityScore || 0),
    contextSignals: Array.isArray(item.contextSignals) ? item.contextSignals : [],
    contextualThemes: Array.isArray(item.contextualThemes) ? item.contextualThemes : [],
    dominantContextCategory: item.dominantContextCategory || null,
    financialClassification: item.financialClassification || null,
    analysisMode: item.analysisMode || null,
    themeDominance: Array.isArray(item.themeDominance) ? item.themeDominance : [],
    dominantLegalThemes: Array.isArray(item.dominantLegalThemes) ? item.dominantLegalThemes : [],
    dominantDomain: item.dominantDomain || null,
    domainDominance: Array.isArray(item.domainDominance) ? item.domainDominance : [],
    secondaryDomains: Array.isArray(item.secondaryDomains) ? item.secondaryDomains : [],
    weakDomains: Array.isArray(item.weakDomains) ? item.weakDomains : [],
    semanticIsolation: item.semanticIsolation || null,
    semanticOwnership: item.semanticOwnership || null,
    semanticNarrative: String(item.semanticNarrative || ''),
    pipelineStages: Array.isArray(item.pipelineStages) ? item.pipelineStages : [],
    contractThemes: Array.isArray(item.contractThemes) ? item.contractThemes : [],
    sectionBreakdown: Array.isArray(item.sectionBreakdown) ? item.sectionBreakdown : [],
    classificationReasoning: item.classificationReasoning || null,
    clauseIntents: Array.isArray(item.clauseIntents) ? item.clauseIntents : [],
    clauseTypeSummary: item.clauseTypeSummary || {},
    semanticContradictions: Array.isArray(item.semanticContradictions) ? item.semanticContradictions : [],
    summary: item.summary,
    excerpt: item.summary || (item.extractedText ? `${item.extractedText.slice(0, 160)}${item.extractedText.length > 160 ? '...' : ''}` : ''),
    risks,
    highlights,
    recommendations: [...new Set(item.recommendations || [])],
    adaptiveRecommendations: Array.isArray(item.adaptiveRecommendations) ? item.adaptiveRecommendations : [],
    positives: uniqueBy(item.positiveIndicators || [], (indicator) => indicator.label).map((indicator) => ({
      label: indicator.label,
      reduction: indicator.reduction,
      matches: [...new Set(indicator.matches || [])]
    }))
  };
};

export const presentAnalysisList = (analyses) => analyses.map(presentAnalysis);
