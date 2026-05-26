import { normalizeText } from './phraseMatcher.js';

const intentPatterns = {
  'advertising intent': [
    /advertis/i,
    /targeted advertis/i,
    /marketing partner/i,
    /tracking pixel/i,
    /cross[-\s]?site tracking/i,
    /third[-\s]?party advertis(?:er|ing)/i
  ],
  'compliance intent': [
    /compliance/i,
    /as required by law/i,
    /governing law/i,
    /pursuant to/i,
    /legal obligation/i,
    /regulatory/i,
    /audit/i,
    /review board/i,
    /ethical review/i
  ],
  'contractual intent': [
    /contract/i,
    /agreement/i,
    /party(?:ies)?/i,
    /shall/i,
    /obligation/i,
    /termination/i,
    /breach/i,
    /indemnif/i,
    /liabilit/i,
    /subcontractor/i
  ],
  'operational intent': [
    /service provider/i,
    /vendor/i,
    /supplier/i,
    /operations?/i,
    /process(?:ing)?/i,
    /support/i,
    /maintenance/i,
    /internal/i
  ],
  'consumer privacy intent': [
    /personal data/i,
    /data subject rights/i,
    /cookie/i,
    /consent/i,
    /privacy policy/i,
    /data controller/i,
    /data processor/i,
    /opt[-\s]?out/i
  ],
  'research intent': [
    /research/i,
    /funding/i,
    /grant/i,
    /project/i,
    /beneficiary/i,
    /publication rights/i,
    /ethical review/i,
    /institutional review board/i
  ]
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const classifyIntent = (text) => {
  const normalized = normalizeText(text);
  const scores = Object.entries(intentPatterns).reduce((result, [intent, patterns]) => {
    const count = patterns.reduce((sum, pattern) => sum + ((pattern instanceof RegExp ? pattern.test(normalized) : normalized.includes(pattern.toLowerCase())) ? 1 : 0), 0);
    if (count > 0) {
      result[intent] = count;
    }
    return result;
  }, {});

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    return [{ intent: 'operational intent', confidence: 0.38, evidenceCount: 0 }];
  }

  const total = sorted.reduce((sum, [, count]) => sum + count, 0);

  return sorted.map(([intent, count]) => ({
    intent,
    confidence: Number(clamp(0.2 + (count / total) * 0.72, 0.22, 0.96).toFixed(2)),
    evidenceCount: count
  }));
};

export const annotateClausesWithIntents = (clauses) =>
  clauses.map((clause) => ({
    clause: clause?.sentence || clause?.text || String(clause || '').trim(),
    intents: classifyIntent(clause?.sentence || clause?.text || String(clause || '').trim())
  }));
