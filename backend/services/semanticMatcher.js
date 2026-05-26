import { normalizeText } from './phraseMatcher.js';

const consumerSignals = [
  /advertis/i,
  /tracking/i,
  /personal data/i,
  /user data/i,
  /consumer data/i,
  /sale of personal/i,
  /opt[-\s]?out/i,
  /third[-\s]?party/i,
  /targeted/i,
  /analytics?/i
];

const legalSignals = [
  /under contract/i,
  /as required by law/i,
  /governing law/i,
  /pursuant to/i,
  /shall/i,
  /obligation/i,
  /party(?:ies)?/i,
  /dispute/i,
  /liabilit(?:y|ies)/i
];

const extractWindow = (normalizedText, matchIndex, matchLength, radius = 140) => {
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(normalizedText.length, matchIndex + matchLength + radius);
  return normalizedText.slice(start, end).trim();
};

const countPatterns = (text, patterns) => patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);

export const analyzeSemanticContext = (normalizedSentence, originalText = '') => {
  const normalized = normalizeText(normalizedSentence);
  const consumerCount = countPatterns(normalized, consumerSignals);
  const legalCount = countPatterns(normalized, legalSignals);
  const base = 45 + consumerCount * 12 - legalCount * 10;
  const score = Math.max(20, Math.min(95, base));
  const isLegalDominant = legalCount > consumerCount + 1 && consumerCount < 2;
  const hasDataIntent = consumerCount > 0;

  return {
    score,
    isConsumerIntent: hasDataIntent,
    isLegalDominant,
    window: originalText || normalizedSentence
  };
};

export const findSemanticWindows = (normalizedText, patterns) => {
  const windows = [];
  const normalized = normalizeText(normalizedText);

  for (const pattern of patterns) {
    if (!pattern) continue;
    const source = pattern instanceof RegExp ? pattern.source : String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = pattern instanceof RegExp ? pattern.flags.replace('g', '') : 'i';
    const matcher = new RegExp(source, `${flags}g`);
    let match;

    while ((match = matcher.exec(normalized))) {
      const window = extractWindow(normalized, match.index, match[0].length);
      windows.push({ phrase: match[0], window });
    }
  }

  return windows;
};

export const scoreSemanticWindow = (windowText, negativePatterns = []) => {
  const normalized = normalizeText(windowText);
  const { score, isConsumerIntent, isLegalDominant } = analyzeSemanticContext(normalized);
  const hasNegative = negativePatterns.some((pattern) => (pattern instanceof RegExp ? pattern.test(normalized) : normalized.includes(String(pattern).toLowerCase())));
  const adjusted = Math.max(20, Math.min(95, score - (hasNegative ? 15 : 0) - (isLegalDominant ? 10 : 0)));

  return {
    score: adjusted,
    isSuppressed: hasNegative || isLegalDominant,
    window: windowText
  };
};
