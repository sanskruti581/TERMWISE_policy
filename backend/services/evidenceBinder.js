import { splitTextIntoSentences } from './phraseMatcher.js';

// Evidence strength categories (Phase 1). Phase 2 will replace confidence-% UI.
export const EVIDENCE_STRENGTH = {
  StrongEvidence: 'StrongEvidence',
  MediumEvidence: 'MediumEvidence',
  WeakEvidence: 'WeakEvidence',
  HeuristicMatch: 'HeuristicMatch',
  SemanticInference: 'SemanticInference',
  OCRDerived: 'OCRDerived'
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Reusable evidence object shape.
 * Kept additive to avoid breaking existing consumers.
 */
export const buildEvidence = ({
  snippet = '',
  page = null,
  paragraphIndex = null,
  sentenceIndex = null,
  sectionIndex = null,
  startOffset = null,
  endOffset = null,
  triggerType = null,
  evidenceStrength = null,
  ocrConfidence = null
} = {}) => {
  return {
    snippet,
    page,
    paragraphIndex,
    sentenceIndex,
    sectionIndex,
    startOffset,
    endOffset,
    triggerType,
    evidenceStrength,
    ocrConfidence,
    // A lightweight audit note; can be expanded later.
    evidenceSource: triggerType ? 'pattern/trigger' : 'text-span'
  };
};

const safeIndexOf = (haystack, needle) => {
  if (!haystack || !needle) return -1;
  try {
    return String(haystack).indexOf(String(needle));
  } catch {
    return -1;
  }
};

const findSectionIndexBestEffort = ({ sections = [], sentence = '' }) => {
  if (!Array.isArray(sections) || !sections.length || !sentence) return null;
  const sent = String(sentence).trim();
  if (!sent) return null;

  const direct = sections.findIndex((s) => {
    const text = s?.text || '';
    return String(text).includes(sent);
  });

  if (direct !== -1) return sections[direct].index ?? direct;

  // fallback: try normalized containment using a shorter snippet
  const short = sent.length > 90 ? sent.slice(0, 90) : sent;
  const fallback = sections.findIndex((s) => String(s?.text || '').includes(short));
  return fallback !== -1 ? sections[fallback].index ?? fallback : null;
};

const deriveSentenceIndex = ({ fullText = '', sentence = '' }) => {
  if (!fullText || !sentence) return null;
  const sentences = splitTextIntoSentences(fullText);
  const target = String(sentence).trim().toLowerCase();
  if (!target) return null;

  const idx = sentences.findIndex((s) => String(s).trim().toLowerCase() === target);
  return idx === -1 ? null : idx;
};

const deriveOffsetsBestEffort = ({ fullText = '', snippet = '' }) => {
  const snip = String(snippet || '').trim();
  const full = String(fullText || '');
  if (!snip || !full) return { startOffset: null, endOffset: null };

  // Best effort: first occurrence of snippet.
  const start = safeIndexOf(full, snip);
  if (start === -1) return { startOffset: null, endOffset: null };
  return { startOffset: start, endOffset: start + snip.length };
};

/**
 * Binds evidence to: snippet, sectionIndex, sentenceIndex, and best-effort offsets.
 */
export const bindTextEvidence = ({
  fullText,
  sections = [],
  sentence,
  snippet,
  triggerType = null,
  evidenceStrength = null,
  page = null,
  paragraphIndex = null,
  ocrConfidence = null,
  // allow overriding snippet used for offsets
  offsetsSnippet
} = {}) => {
  const finalSnippet = (snippet ?? sentence ?? '').toString().trim();
  const sectionIndex = findSectionIndexBestEffort({ sections, sentence: sentence ?? finalSnippet });
  const sentenceIndex = deriveSentenceIndex({ fullText: String(fullText || ''), sentence: sentence ?? finalSnippet });
  const { startOffset, endOffset } = deriveOffsetsBestEffort({
    fullText: String(fullText || ''),
    snippet: (offsetsSnippet ?? finalSnippet)
  });

  return buildEvidence({
    snippet: finalSnippet,
    page,
    paragraphIndex,
    sentenceIndex,
    sectionIndex,
    startOffset,
    endOffset,
    triggerType,
    evidenceStrength,
    ocrConfidence
  });
};

/**
 * Heuristic mapping from legacy certainty (0..100) into evidenceStrength.
 * Phase 2 will replace reliance on certainty.
 */
export const certaintyToEvidenceStrength = (certainty = null) => {
  const c = typeof certainty === 'number' ? certainty : null;
  if (c === null || !Number.isFinite(c)) return EVIDENCE_STRENGTH.WeakEvidence;
  if (c >= 75) return EVIDENCE_STRENGTH.StrongEvidence;
  if (c >= 45) return EVIDENCE_STRENGTH.MediumEvidence;
  return EVIDENCE_STRENGTH.WeakEvidence;
};

export const limitEvidenceArray = (arr, max = 3) => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
};

export const docEvidenceQualitySummary = ({ ocrConfidence = null } = {}) => {
  // Phase 1 placeholder: we can show this in UI later.
  if (typeof ocrConfidence !== 'number') return { ocrQuality: 'unknown' };
  if (ocrConfidence >= 80) return { ocrQuality: 'good', ocrConfidence };
  if (ocrConfidence >= 55) return { ocrQuality: 'ok', ocrConfidence };
  return { ocrQuality: 'poor', ocrConfidence };
};

