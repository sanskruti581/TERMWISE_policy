export const normalizeText = (text) =>
  String(text || '')
    .replace(/\r\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const findMatches = (text, patterns) => {
  const normalized = normalizeText(text);
  return patterns.flatMap((pattern) => {
    if (!pattern) return [];
    if (typeof pattern === 'string') {
      return normalized.includes(pattern.toLowerCase()) ? [pattern] : [];
    }

    if (pattern instanceof RegExp) {
      const matcher = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
      const matches = [...normalized.matchAll(matcher)];
      return matches.map((match) => match[0]);
    }

    return [];
  }).filter(Boolean);
};

export const sentenceMatches = (sentence, positivePatterns, negativePatterns = []) => {
  const normalized = normalizeText(sentence);
  if (!normalized) return false;
  const hasPositive = positivePatterns.some((pattern) => (pattern instanceof RegExp ? pattern.test(normalized) : normalized.includes(pattern.toLowerCase())));
  const hasNegative = negativePatterns.some((pattern) => (pattern instanceof RegExp ? pattern.test(normalized) : normalized.includes(pattern.toLowerCase())));
  return hasPositive && !hasNegative;
};

export const splitTextIntoSentences = (text) =>
  normalizeText(text)
    .replace(/\|{2,}/g, ' ')
    .replace(/\.\.\.+/g, '.')
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 15);
