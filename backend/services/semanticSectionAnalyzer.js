import { analyzeDocumentSections as parseDocumentSections } from './sectionParser.js';
import { aggregateThemeDominance } from './themeAggregator.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const analyzeDocumentSections = (text) => {
  const sectionAnalysis = parseDocumentSections(text);
  const themeSummary = aggregateThemeDominance(sectionAnalysis.sections);
  const dominantLegal = themeSummary.dominantDomain?.key === 'legal';

  const sections = sectionAnalysis.sections.map((section) => {
    const semanticImportance = Number(clamp(section.share * (section.themeConfidence || 0.35) * 1.32, 0.08, 0.96).toFixed(2));
    const isolatedPrivacy = dominantLegal && section.topTheme === 'privacy' && section.share < 0.08;
    const adjustedThemeConfidence = Number(
      clamp((section.themeConfidence || 0.35) * (isolatedPrivacy ? 0.7 : 1.0), 0.18, 0.96).toFixed(2)
    );

    return {
      ...section,
      semanticImportance,
      themeConfidence: adjustedThemeConfidence,
      sectionLabel: section.heading || 'General terms'
    };
  });

  return {
    sections,
    sectionCount: sectionAnalysis.sectionCount
  };
};
