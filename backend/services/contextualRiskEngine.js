import { findMatches, sentenceMatches, splitTextIntoSentences } from './phraseMatcher.js';
import { findSemanticWindows, scoreSemanticWindow } from './semanticMatcher.js';

import { classifyIntent } from './intentClassifier.js';
import { bindTextEvidence, certaintyToEvidenceStrength, limitEvidenceArray } from './evidenceBinder.js';


const typeRuleModifiers = {
  'Research/Funding Agreement': {
    'Third-party sharing and marketing partners': 0.55,
    'Cookies and advertising tracking': 0.55,
    'Location tracking': 0.7,
    'Data selling': 0.7,
    'Weak user consent': 0.8
  },
  'Legal Contract': {
    'Third-party sharing and marketing partners': 0.65,
    'Cookies and advertising tracking': 0.6,
    'Location tracking': 0.7,
    'Data selling': 0.75
  },
  'Financial Document': {
    'Third-party sharing and marketing partners': 0.45,
    'Cookies and advertising tracking': 0.35,
    'Location tracking': 0.55,
    'Data selling': 0.6,
    'Permanent data retention': 0.75,
    'Weak user consent': 0.7
  },
  'Administrative Document': {
    'Third-party sharing and marketing partners': 0.6,
    'Cookies and advertising tracking': 0.6,
    'Location tracking': 0.65,
    'Data selling': 0.75,
    'Weak user consent': 0.8
  }
};

const MAX_HIGHLIGHT_LENGTH = 260;

const getFocusedSentence = (sentence, patterns) => {
  if (!sentence) return '';
  const clean = sentence.trim();
  if (clean.length <= MAX_HIGHLIGHT_LENGTH) return clean;
  const split = clean.split(/(?<=[.!?])\s+/);
  return (
    split.find((segment) =>
      patterns.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(segment) : segment.toLowerCase().includes(pattern.toLowerCase())
      )
    ) || `${clean.slice(0, MAX_HIGHLIGHT_LENGTH).trim()}...`
  );
};

const sentenceToHighlight = (sentence, patterns) => {
  const highlight = getFocusedSentence(sentence, patterns);
  return highlight.replace(/\s+/g, ' ').trim();
};

const getTypeModifier = (category, documentType) => {
  return typeRuleModifiers[documentType]?.[category] ?? 1.0;
};

const evaluateSentenceMatch = (sentence, rule) => {
  const semanticWindows = findSemanticWindows(sentence, rule.positivePatterns);
  const scoredWindows = semanticWindows
    .map((entry) => scoreSemanticWindow(entry.window, rule.negativePatterns))
    .filter((result) => !result.isSuppressed);

  const hasBaseline = sentenceMatches(sentence, rule.positivePatterns, rule.negativePatterns);

  if (!hasBaseline && !scoredWindows.length) {
    return null;
  }

  const bestWindow = scoredWindows.sort((a, b) => b.score - a.score)[0];
  const certainty = Math.max(40, Math.min(95, (bestWindow?.score || 50) + (hasBaseline ? 10 : 0)));
  const clause = bestWindow?.window || sentence;
  const intentCategories = classifyIntent(clause);

  return {
    certainty,
    clause,
    matches: bestWindow ? [bestWindow.window] : [sentence],
    intentCategories
  };
};

const riskRules = [
  // --- Operational / enforcement / payment language (contract-context) ---
  // These categories intentionally use points so they contribute to riskScore.
  // They are evidence-first and can coexist with other semantic modes.
  {
    category: 'Penalty and default clauses',
    points: 28,
    recommendation: 'Review penalty, default, and enforcement mechanics (triggers, calculation method, notice/cure periods) and ensure they are commercially reasonable.',
    positivePatterns: [
      /penalt(?:y|ies)(?:\s+clauses?)?/i,
      /default(?:\s+or\s+event\s+of\s+default)?/i,
      /event of default/i,
      /late fee/i,
      /liquidated damages/i,
      /forfeit(?:ure)?/i,
      /remedy/i,
      /enforc(?:e|ement)/i,
      /terminate(?:\s+for)?\s+cause/i
    ],
    negativePatterns: []
  },
  {
    category: 'Repayment obligations',
    points: 22,
    recommendation: 'Review repayment obligations (amount, schedule, interest/default interest, acceleration clauses) and confirm the triggering conditions and calculation basis.',
    positivePatterns: [
      /repay(?:ment)?/i,
      /payment schedule/i,
      /installment(?:s)?/i,
      /amortiz(?:ation|e)/i,
      /due and payable/i,
      /outstanding(?:\s+(?:principal|amount))?/i,
      /accelerat(?:ion)?/i
    ],
    negativePatterns: []
  },
  {
    category: 'Termination and enforcement triggers',
    points: 24,
    recommendation: 'Review termination triggers and enforcement steps (notice, cure periods, survival obligations) to prevent unexpected escalations.',
    positivePatterns: [
      /terminate(?:\s+for)?\s+cause/i,
      /termination(?:\s+for)?\s+/i,
      /immediate\s+termination/i,
      /right to terminate/i,
      /breach\s+of/i,
      /remedy(?:\s+for)?\s+/i,
      /enforcement/i
    ],
    negativePatterns: []
  },
  {
    category: 'Collection and recovery activity',
    points: 20,
    recommendation: 'Review collection/recovery clauses (collection authority, third-party collection, contact practices) and ensure procedures are proportionate.',
    positivePatterns: [
      /collection/i,
      /recovery/i,
      /recover(?:y|able)/i,
      /debt collection/i,
      /third-party collection/i,
      /collection agency/i
    ],
    negativePatterns: []
  },

  // --- Existing privacy/data-risk rules ---
  {
    category: 'Data selling',
    points: 30,
    recommendation: 'Avoid services that sell personal information without a clear choice and prefer vendors with transparent opt-out rights.',
    positivePatterns: [
      /sell(?:s|ing)? (?:personal|user|consumer|identifiable)? information/i,
      /sale of personal information/i,
      /sold to advertisers/i,
      /selling personal data/i,
      /share(?:s|d|ing)? (?:user|personal|consumer) data with third[-\s]?part(?:y|ies)/i
    ],
    negativePatterns: [/third[-\s]?part(?:y|ies) (?:vendor|supplier|contractor)/i, /as required by law/i]
  },
  {
    category: 'Biometric collection',
    points: 35,
    recommendation: 'Avoid sharing biometric identifiers unless collection, storage, and deletion terms are clearly defined.',
    positivePatterns: [/biometric/i, /face(?:print| recognition)/i, /fingerprint/i, /voiceprint/i, /retina|iris scan/i],
    negativePatterns: []
  },
  {
    category: 'Third-party sharing and marketing partners',
    points: 25,
    recommendation: 'Review which third parties receive user data, especially marketing and analytics partners, and whether sharing is optional.',
    positivePatterns: [
      /third[-\s]?party (?:advertis(?:er|ing)|analytics|tracking|marketing|partner)/i,
      /share(?:d|s|ing)? (?:user|personal|consumer) data with (?:partners|advertisers|affiliates)/i,
      /share(?:d|s|ing)? data with (?:third[-\s]?part(?:ies|y)|service providers)/i,
      /service providers? (?:may|will|can) access (?:your|user|personal) data/i
    ],
    negativePatterns: [
      /third[-\s]?part(?:y|ies) (?:under contract|under this agreement|to fulfill)/i,
      /disclose information to third[-\s]?part(?:ies|y) under (?:law|contract)/i
    ]
  },
  {
    category: 'Location tracking',
    points: 20,
    recommendation: 'Disable precise location access unless it is necessary for the service feature you use.',
    positivePatterns: [
      /precise location/i,
      /gps/i,
      /geolocation/i,
      /location data/i,
      /track(?:ing)? (?:your|user|device) location/i,
      /collect(?:s|ing)? precise location/i
    ],
    negativePatterns: []
  },
  {
    category: 'Cookies and advertising tracking',
    points: 20,
    recommendation: 'Use cookie controls and opt out of personalized advertising when possible.',
    positivePatterns: [
      /cookies/i,
      /tracking pixel/i,
      /device identifier/i,
      /analytics technologies/i,
      /targeted advertis/i,
      /personalized advertis/i,
      /ad network/i,
      /cross[-\s]?site tracking/i
    ],
    negativePatterns: [/non[-\s]?personal data/i]
  },
  {
    category: 'Permanent data retention',
    points: 25,
    recommendation: 'Look for clear retention periods and a deletion request process rather than indefinite retention.',
    positivePatterns: [
      /retain(?:s|ing)? (?:your|personal|user)? data (?:indefinitely|permanently|for an unlimited time)/i,
      /as long as necessary/i,
      /backup archives/i,
      /not delete(?:d|ing)?/i,
      /retain records for (?:a period of )?\d+/i
    ],
    negativePatterns: []
  },
  {
    category: 'Weak user consent',
    points: 15,
    recommendation: 'Prefer clear, specific consent mechanisms rather than broad acceptance through continued use.',
    positivePatterns: [
      /may collect (?:your|user|personal) data/i,
      /by using (?:the service|this website|this application) you consent/i,
      /continued use/i,
      /deemed consent/i,
      /at our discretion/i
    ],
    negativePatterns: [
      /as required by law/i,
      /disclose information to third[-\s]?part(?:ies|y) under contract/i
    ]
  }
];

const getSeverityLabel = (points) => {
  if (points >= 30) return 'High Risk';
  if (points >= 25) return 'Risky';
  if (points >= 15) return 'Moderate';
  return 'Safe';
};

export const analyzeRisk = (text, documentType, { sections = [] } = {}) => {
  const sentences = splitTextIntoSentences(text);
  const detectedRisks = [];
  const highlightedClauses = [];
  const clauseIntents = [];

  // Evidence grounding (best-effort): bind to section/sentence indices.
  // Keep legacy fields intact for backward compatibility.



  for (const rule of riskRules) {
    const candidates = sentences
      .map((sentence) => evaluateSentenceMatch(sentence, rule))
      .filter(Boolean);

    if (!candidates.length) continue;

    const rawMatches = findMatches(text, rule.positivePatterns);
    const averageCertainty = Math.round(candidates.reduce((sum, item) => sum + item.certainty, 0) / candidates.length);
    const modifier = getTypeModifier(rule.category, documentType);
    const points = Math.max(5, Math.round(rule.points * modifier * Math.max(0.75, averageCertainty / 100)));
    const clauses = candidates.slice(0, 4).map((item) => sentenceToHighlight(item.clause, rule.positivePatterns));

    // Evidence for this risk category: bind the top clauses (best-effort).
    const evidence = limitEvidenceArray(
      candidates
        .slice(0, 3)
        .map((item) =>
          bindTextEvidence({
            fullText: text,
            sections,
            sentence: item.clause,
            snippet: sentenceToHighlight(item.clause, rule.positivePatterns),
            triggerType: rule.category,
            evidenceStrength: certaintyToEvidenceStrength(item.certainty)
          })
        ),
      3
    );

    detectedRisks.push({
      category: rule.category,
      severity: getSeverityLabel(points),
      points,
      certainty: averageCertainty,
      recommendation: rule.recommendation,
      matches: [...new Set(rawMatches)],
      clauses,
      evidence,
      intentCategories: candidates.flatMap((item) => item.intentCategories || [])
    });


    const topClause = candidates.sort((a, b) => b.certainty - a.certainty)[0];
    const topSnippet = sentenceToHighlight(topClause.clause, rule.positivePatterns);

    // Evidence for the best matching highlighted clause (best-effort).
    const highlightedEvidence = bindTextEvidence({
      fullText: text,
      sections,
      sentence: topClause.clause,
      snippet: topSnippet,
      triggerType: rule.category,
      evidenceStrength: certaintyToEvidenceStrength(topClause.certainty)
    });

    highlightedClauses.push({
      category: rule.category,
      severity: getSeverityLabel(points),
      sentence: topSnippet,
      intentTypes: topClause.intentCategories.map((entry) => entry.intent),
      intentConfidence: topClause.intentCategories[0]?.confidence || 0,
      // Ensure adaptive scoring can use clause impact
      dimensions: { riskSeverity: points },
      evidence: [highlightedEvidence]
    });


    clauseIntents.push(
      ...candidates.map((item) => ({
        clause: sentenceToHighlight(item.clause, rule.positivePatterns),
        intents: item.intentCategories,
        certainty: item.certainty
      }))
    );
  }

  return {
    detectedRisks,
    highlightedClauses: highlightedClauses.slice(0, 8),
    clauseIntents
  };
};

export const findPositiveIndicators = (text) => {
  const indicators = [
    {
      label: 'Data deletion support',
      reduction: 6,
      patterns: [/delete your (?:personal )?data/i, /request deletion/i, /right to deletion/i, /erase your data/i, /account deletion/i]
    },
    {
      label: 'Opt-out controls',
      reduction: 5,
      patterns: [/opt[-\s]?out/i, /withdraw consent/i, /manage your preferences/i, /cookie preferences?/i, /unsubscribe/i]
    },
    {
      label: 'Encryption mentions',
      reduction: 4,
      patterns: [/encrypt(?:ed|ion)?/i, /transport layer security/i, /\bTLS\b/i, /\bSSL\b/i]
    },
    {
      label: 'GDPR compliance',
      reduction: 4,
      patterns: [/\bGDPR\b/i, /general data protection regulation/i, /data subject rights/i]
    },
    {
      label: 'Limited retention periods',
      reduction: 6,
      patterns: [/retain (?:your )?(?:personal )?data for \d+/i, /deleted after \d+/i, /limited retention/i, /retention period/i, /only as long as needed/i]
    }
  ];

  return indicators
    .map((indicator) => {
      const matches = findMatches(text, indicator.patterns);
      if (!matches.length) return null;
      return {
        label: indicator.label,
        reduction: indicator.reduction,
        matches: [...new Set(matches)]
      };
    })
    .filter(Boolean);
};

export const getRiskRuleTotal = () => riskRules.reduce((sum, rule) => sum + rule.points, 0);
