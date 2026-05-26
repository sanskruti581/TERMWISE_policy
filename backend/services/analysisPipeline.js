import { classifyDocument } from './documentClassifier.js';
import { classifyFinancialDocument } from './financialDocumentClassifier.js';
import { analyzeDocumentSections } from './semanticSectionAnalyzer.js';
import { rankContextSignals } from './signalRanker.js';
import { aggregateThemeDominance } from './themeAggregator.js';
import { classifyLegalSubtype } from './legalSubtypeClassifier.js';
import { calibrateSemanticSignals } from './semanticCalibration.js';
import { normalizeSignalConfidences } from './confidenceNormalizer.js';
import { balanceContextSignals } from './semanticBalancer.js';
import { analyzeRisk, findPositiveIndicators } from './contextualRiskEngine.js';
import { calculateRiskScore, determineAnalysisReliability, getRiskGrade, getRiskLevelLabel, buildAdaptiveRiskProfile } from './scoringEngine.js';
import { buildSemanticExplanation } from './semanticExplainer.js';
import { validateConfidenceProfile } from './confidenceValidator.js';
import { classifyClauseTypes, summarizeClauseTypes } from './clauseTypeClassifier.js';
import { buildNarrativeSummary } from './narrativeSummaryEngine.js';
import { buildAdaptiveRecommendations } from './adaptiveRecommendationEngine.js';
import { isolateSemanticThemes } from './semanticIsolationEngine.js';
import { detectSemanticContradictions } from './contradictionDetector.js';
import { generateSemanticNarrative } from './semanticNarrativeGenerator.js';

const getAnalysisMode = (classification, subtype) => {
  const label = `${classification.documentType || ''} ${subtype.documentDomain || ''} ${subtype.documentSubtype || ''}`.toLowerCase();
  if (/privacy/.test(label)) {
    return {
      key: 'privacy',
      label: 'Privacy Policy Mode',
      focus: ['Tracking', 'Cookies', 'Third-party sharing', 'Consent quality', 'Retention', 'Data selling']
    };
  }
  if (/financial|loan|mortgage|banking/.test(label)) {
    return {
      key: 'financial',
      label: 'Financial Document Mode',
      focus: ['Repayment obligations', 'Penalties/default', 'Collateral/security', 'Collection activity', 'Credit bureau disclosure']
    };
  }
  if (/research|funding/.test(label)) {
    return {
      key: 'research',
      label: 'Research/Compliance Mode',
      focus: ['Compliance obligations', 'Reporting duties', 'Operational complexity', 'Confidentiality', 'Deliverables']
    };
  }
  return {
    key: 'legal',
    label: 'Legal/Commercial Contract Mode',
    focus: ['Liability', 'Warranties', 'Governing law', 'Indemnification', 'Payment/delivery conditions']
  };
};

export const runAnalysisPipeline = (text) => {
  const sectionAnalysis = analyzeDocumentSections(text);
  const initialClassification = classifyDocument(text);
  const financialClassification = classifyFinancialDocument(text, sectionAnalysis.sections);
  const classification = financialClassification.isFinancial
    ? { ...initialClassification, documentType: 'Financial Document', documentTypeConfidence: Math.max(initialClassification.documentTypeConfidence || 0, financialClassification.financialConfidence) }
    : initialClassification;
  const rawThemeSummary = aggregateThemeDominance(sectionAnalysis.sections);
  const baseSubtype = classifyLegalSubtype(classification, rawThemeSummary, text);
  const subtype = financialClassification.isFinancial
    ? {
        ...baseSubtype,
        documentDomain: 'Financial/Loan Agreements',
        documentDomainConfidence: Math.max(baseSubtype.documentDomainConfidence || 0, financialClassification.financialConfidence),
        documentSubtype: financialClassification.financialSubtype,
        documentSubtypeConfidence: Math.max(baseSubtype.documentSubtypeConfidence || 0, Math.min(financialClassification.financialConfidence - 8, 86))
      }
    : baseSubtype;
  const analysisMode = getAnalysisMode(classification, subtype);
  const themeSummary = isolateSemanticThemes({ themeSummary: rawThemeSummary, classification, subtype });
  const semanticContradictions = detectSemanticContradictions({ themeSummary, semanticIsolation: themeSummary.semanticIsolation });
  const rawContext = rankContextSignals(text, classification.documentType, sectionAnalysis.sections);
  const calibratedSignals = calibrateSemanticSignals(rawContext.signals, themeSummary, sectionAnalysis.sections, classification.documentType);
  const normalizedSignals = normalizeSignalConfidences(calibratedSignals);
  const context = balanceContextSignals(normalizedSignals, sectionAnalysis.sections, themeSummary.themeDominance, classification.documentType);
  const positiveIndicators = findPositiveIndicators(text);
  const { detectedRisks, highlightedClauses, clauseIntents } = analyzeRisk(text, classification.documentType);
  const semanticClauses = classifyClauseTypes(text);
  const clauseTypeSummary = summarizeClauseTypes(semanticClauses);
  const mergedHighlights = [...highlightedClauses, ...semanticClauses]
    .filter((clause, index, clauses) => clauses.findIndex((item) => String(item.sentence).toLowerCase() === String(clause.sentence).toLowerCase()) === index)
    .slice(0, 10);
  const riskScore = calculateRiskScore(detectedRisks, positiveIndicators, classification.documentType);
  const reliability = determineAnalysisReliability(detectedRisks, classification.documentTypeConfidence, context.signals.length);
  const adaptiveRiskProfile = buildAdaptiveRiskProfile({
    score: riskScore,
    documentType: classification.documentType,
    documentDomain: subtype.documentDomain,
    highlightedClauses: mergedHighlights,
    detectedRisks
  });
  const confidenceProfile = validateConfidenceProfile({ classification, subtype, themeSummary, context, reliability });
  const semanticNarrative = generateSemanticNarrative({ analysisMode, subtype, themeSummary }) || buildNarrativeSummary({ subtype, themeSummary, financialClassification, clauseTypeSummary });
  const explanation = buildSemanticExplanation({ classification: { ...classification, ...confidenceProfile }, context, themeSummary, subtype: { ...subtype, ...confidenceProfile }, detectedRisks, positiveIndicators });
  const adaptiveRecommendations = buildAdaptiveRecommendations({ analysisMode, themeSummary, detectedRisks, highlightedClauses: mergedHighlights });
  const recommendations = adaptiveRecommendations.map((item) => `${item.priority}: ${item.text}`);

  return {
    ...classification,
    ...subtype,
    ...confidenceProfile,
    financialClassification,
    analysisMode,
    detectedRisks,
    highlightedClauses: mergedHighlights,
    positiveIndicators,
    riskScore,
    privacyGrade: getRiskGrade(riskScore),
    riskLevel: getRiskLevelLabel(riskScore),
    adaptiveRiskProfile,
    analysisConfidence: confidenceProfile.analysisConfidence,
    analysisReliability: confidenceProfile.analysisReliability,
    analysisReliabilityScore: confidenceProfile.analysisReliabilityScore,
    recommendations,
    adaptiveRecommendations,
    contextSignals: context.signals,
    contextualThemes: themeSummary.themeDominance.map((theme) => theme.label),
    dominantContextCategory: context.dominantCategory,
    classificationReasoning: explanation.classificationReasoning,
    clauseIntents,
    clauseTypeSummary,
    semanticContradictions,
    contextClusterConfidence: context.categoryDominance,
    themeDominance: themeSummary.themeDominance,
    dominantLegalThemes: themeSummary.dominantLegalThemes,
    dominantDomain: themeSummary.dominantDomain?.label || subtype.documentDomain,
    domainDominance: themeSummary.domainDominance,
    secondaryDomains: themeSummary.secondaryDomains,
    weakDomains: themeSummary.weakDomains,
    semanticIsolation: themeSummary.semanticIsolation,
    semanticOwnership: themeSummary.semanticOwnership,
    semanticNarrative,
    pipelineStages: [
      { label: 'Extracting text', status: 'complete' },
      { label: 'Parsing sections', status: 'complete' },
      { label: 'Domain classification', status: 'complete' },
      { label: 'Running semantic balancing', status: 'complete' },
      { label: 'Clause intelligence', status: 'complete' },
      { label: 'Recommendation generation', status: 'complete' }
    ],
    sectionBreakdown: sectionAnalysis.sections.map((section) => ({
      heading: section.heading,
      topTheme: section.topTheme,
      theme: section.topTheme,
      share: section.share,
      summary: section.summary,
      semanticImportance: section.semanticImportance,
      themeConfidence: section.themeConfidence
    }))
  };
};
