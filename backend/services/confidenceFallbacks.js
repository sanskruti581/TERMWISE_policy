const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const deriveDocumentTypeConfidence = ({ classification = {}, subtype = {}, themeSummary = {}, context = {} }) => {
  const explicit = asNumber(classification.documentTypeConfidence, 0);
  if (explicit > 0) return clamp(Math.round(explicit), 35, 95);

  const domainShare = asNumber(themeSummary.dominantDomain?.share, 0);
  const signalCount = Array.isArray(context.signals) ? context.signals.length : 0;
  return clamp(Math.round(42 + domainShare * 38 + Math.min(12, signalCount * 2) + asNumber(subtype.documentSubtypeConfidence, 0) * 0.08), 38, 90);
};

export const deriveDomainConfidence = ({ subtype = {}, themeSummary = {}, classification = {} }) => {
  const explicit = asNumber(subtype.documentDomainConfidence, 0);
  if (explicit > 0) return clamp(Math.round(explicit), 40, 95);

  const domainShare = asNumber(themeSummary.dominantDomain?.share, 0);
  const typeConfidence = asNumber(classification.documentTypeConfidence, 0);
  return clamp(Math.round(45 + domainShare * 42 + typeConfidence * 0.08), 42, 95);
};

export const deriveSubtypeConfidence = ({ subtype = {}, domainConfidence = 0, themeSummary = {}, context = {} }) => {
  const explicit = asNumber(subtype.documentSubtypeConfidence, 0);
  const topThemeShare = asNumber(themeSummary.dominantTheme?.share, 0);
  const signalCount = Array.isArray(context.signals) ? context.signals.length : 0;
  const fallback = Math.round(46 + topThemeShare * 24 + Math.min(10, signalCount * 1.5));
  const candidate = explicit > 0 ? explicit : fallback;
  return clamp(Math.round(candidate), 38, Math.max(38, asNumber(domainConfidence, 70) - 4));
};

export const deriveReliabilityScore = ({ reliability = {}, documentTypeConfidence = 0, domainConfidence = 0, subtypeConfidence = 0, context = {} }) => {
  const explicit = asNumber(reliability.score, 0);
  if (explicit > 0) return clamp(Math.round(explicit), 25, 96);

  const signalCount = Array.isArray(context.signals) ? context.signals.length : 0;
  return clamp(Math.round(documentTypeConfidence * 0.28 + domainConfidence * 0.34 + subtypeConfidence * 0.24 + Math.min(12, signalCount * 2)), 35, 94);
};

export const labelReliability = (score) => {
  if (score >= 76) return 'High';
  if (score >= 48) return 'Medium';
  return 'Low';
};
