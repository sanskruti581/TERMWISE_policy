import {
  deriveDocumentTypeConfidence,
  deriveDomainConfidence,
  deriveReliabilityScore,
  deriveSubtypeConfidence,
  labelReliability
} from './confidenceFallbacks.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const validateConfidenceProfile = ({ classification, subtype, themeSummary, context, reliability }) => {
  const documentTypeConfidence = deriveDocumentTypeConfidence({ classification, subtype, themeSummary, context });
  const documentDomainConfidence = deriveDomainConfidence({ subtype, themeSummary, classification: { ...classification, documentTypeConfidence } });
  const documentSubtypeConfidence = deriveSubtypeConfidence({ subtype, domainConfidence: documentDomainConfidence, themeSummary, context });
  const analysisReliabilityScore = deriveReliabilityScore({
    reliability,
    documentTypeConfidence,
    domainConfidence: documentDomainConfidence,
    subtypeConfidence: documentSubtypeConfidence,
    context
  });

  return {
    documentTypeConfidence: clamp(documentTypeConfidence, 1, 95),
    documentDomainConfidence: clamp(documentDomainConfidence, documentSubtypeConfidence, 95),
    documentSubtypeConfidence: clamp(documentSubtypeConfidence, 1, documentDomainConfidence),
    analysisReliabilityScore,
    analysisReliability: labelReliability(analysisReliabilityScore),
    analysisConfidence: labelReliability(analysisReliabilityScore)
  };
};
