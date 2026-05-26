import { findMatches, normalizeText } from './phraseMatcher.js';

const signalDefinitions = [
  {
    label: 'Procurement agreement',
    patterns: [/procurement agreement/i, /supplier agreement/i, /purchase order/i, /vendor agreement/i, /goods and services/i, /delivery obligations?/i],
    category: 'commercial',
    types: ['Research/Funding Agreement', 'Legal Contract'],
    weight: 4
  },
  {
    label: 'Funding agreement',
    patterns: [/funding agreement/i, /grant agreement/i, /grant funding/i, /project contract/i, /state aid/i],
    category: 'researchFunding',
    types: ['Research/Funding Agreement'],
    weight: 4
  },
  {
    label: 'Confidentiality clauses',
    patterns: [/confidentiality obligations?/i, /non[-\s]?disclosure/i, /confidential information/i, /privacy of information/i],
    category: 'confidentiality',
    types: ['Legal Contract', 'Research/Funding Agreement', 'Privacy Policy'],
    weight: 4
  },
  {
    label: 'Payment obligations',
    patterns: [/payment(?:s| terms)?/i, /invoice/i, /amount payable/i, /due date/i, /billing/i, /fee(?:s)?/i, /purchase price/i],
    category: 'payment',
    types: ['Legal Contract', 'Research/Funding Agreement'],
    weight: 4
  },
  {
    label: 'Warranty and liability',
    patterns: [/warrant(?:y|ies)/i, /liabilit(?:y|ies)/i, /indemnif(?:y|ication)/i, /limitation(?:s)? of liability/i, /damages?/i],
    category: 'liability',
    types: ['Legal Contract', 'Terms & Conditions'],
    weight: 4
  },
  {
    label: 'Loan repayment obligations',
    patterns: [/\bEMI\b/i, /equated monthly instal(?:l)?ment/i, /repayment schedule/i, /repayment/i, /monthly instal(?:l)?ment/i],
    category: 'repayment',
    types: ['Financial Document', 'Legal Contract'],
    weight: 5
  },
  {
    label: 'Mortgage and collateral',
    patterns: [/mortgage/i, /collateral/i, /security interest/i, /hypothecation/i, /secured asset/i, /charge over/i],
    category: 'mortgage',
    types: ['Financial Document', 'Legal Contract'],
    weight: 5
  },
  {
    label: 'Penalties and default charges',
    patterns: [/penal(?:ty| charges?)/i, /late payment/i, /default interest/i, /overdue amount/i, /bounce charges?/i, /foreclosure/i],
    category: 'penalties',
    types: ['Financial Document', 'Legal Contract'],
    weight: 4
  },
  {
    label: 'Credit bureau disclosure',
    patterns: [/credit bureau/i, /\bCIBIL\b/i, /authorized to disclose/i, /disclose information/i, /transunion/i],
    category: 'creditDisclosure',
    types: ['Financial Document', 'Legal Contract'],
    weight: 4
  },
  {
    label: 'Collection and recovery activity',
    patterns: [/collection purpose/i, /recovery agent/i, /debt collection/i, /third parties appointed/i, /recover(?:y)? proceedings?/i],
    category: 'collectionRecovery',
    types: ['Financial Document', 'Legal Contract'],
    weight: 4
  },
  {
    label: 'Indemnification',
    patterns: [/indemnif(?:y|ication|ied)/i, /hold harmless/i, /defend and indemnify/i, /third[-\s]?party claims?/i],
    category: 'indemnification',
    types: ['Legal Contract', 'Terms & Conditions'],
    weight: 3
  },
  {
    label: 'Termination conditions',
    patterns: [/termination/i, /terminate this agreement/i, /material breach/i, /expiration/i, /surviv(?:e|al)/i],
    category: 'termination',
    types: ['Legal Contract', 'Terms & Conditions', 'Research/Funding Agreement'],
    weight: 3
  },
  {
    label: 'Governing law',
    patterns: [/governing law/i, /choice of law/i, /venue/i, /jurisdiction/i, /governed by/i],
    category: 'governingLaw',
    types: ['Legal Contract', 'Terms & Conditions'],
    weight: 3
  },
  {
    label: 'Export compliance',
    patterns: [/export control/i, /sanctions?/i, /customs?/i, /trade control/i, /export license/i, /restricted country/i],
    category: 'export',
    types: ['Legal Contract', 'Compliance Document'],
    weight: 3
  },
  {
    label: 'Dispute resolution',
    patterns: [/dispute resolution/i, /arbitration/i, /mediation/i, /litigation/i, /court of competent/i],
    category: 'disputeResolution',
    types: ['Legal Contract', 'Terms & Conditions'],
    weight: 3
  },
  {
    label: 'Intellectual property',
    patterns: [/intellectual property/i, /patent/i, /copyright/i, /trademark/i, /license/i, /ownership/i, /proprietary/i],
    category: 'intellectualProperty',
    types: ['Legal Contract', 'Research/Funding Agreement'],
    weight: 3
  },
  {
    label: 'Consumer privacy terms',
    patterns: [/personal data/i, /data subject rights/i, /cookie preferences?/i, /privacy policy/i, /data controller/i, /data processor/i, /consent/i],
    category: 'privacy',
    types: ['Privacy Policy', 'Legal Contract'],
    weight: 3
  },
  {
    label: 'Advertising and tracking',
    patterns: [/third[-\s]?party advertis(?:er|ing)/i, /marketing partner/i, /targeted advertis/i, /tracking pixel/i, /cross[-\s]?site tracking/i],
    category: 'advertising',
    types: ['Privacy Policy', 'Legal Contract'],
    weight: 3
  },
  {
    label: 'Operational obligations',
    patterns: [/service provider/i, /vendor compliance/i, /subcontractor/i, /supplier obligations?/i, /service levels?/i, /maintenance/i],
    category: 'operational',
    types: ['Legal Contract', 'Research/Funding Agreement', 'Administrative Document'],
    weight: 2
  }
];

const MAX_SIGNALS = 10;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const scoreSectionCount = (patterns, sections) => {
  if (!Array.isArray(sections) || !sections.length) return 0;
  return sections.reduce((sum, section) => {
    const matches = findMatches(section.text, patterns).length;
    return sum + matches * section.share;
  }, 0);
};

const buildSignal = (entry, occurrences, documentType, sectionWeighted) => {
  const typeAffinity = entry.types.includes(documentType) ? 1.2 : 0;
  const rawStrength = occurrences * entry.weight + sectionWeighted * 1.4 + typeAffinity * 2;
  const confidence = clamp(0.16 + rawStrength * 0.088, 0.18, 0.98);
  const contextualWeight = clamp(0.14 + rawStrength * 0.05, 0.18, 0.99);

  return {
    label: entry.label,
    category: entry.category,
    occurrences,
    sectionWeight: Number(clamp(sectionWeighted, 0, 1).toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    contextualWeight: Number(contextualWeight.toFixed(2)),
    typeAffinity,
    types: entry.types,
    rawStrength: Number(rawStrength.toFixed(2))
  };
};

export const rankContextSignals = (text, documentType, sections = []) => {
  const normalized = normalizeText(text);
  const candidates = signalDefinitions
    .map((entry) => {
      const matches = findMatches(normalized, entry.patterns);
      const occurrences = matches.length;
      const sectionWeighted = scoreSectionCount(entry.patterns, sections);
      return occurrences ? buildSignal(entry, occurrences, documentType, sectionWeighted) : null;
    })
    .filter(Boolean);

  const totalWeighted = candidates.reduce((sum, signal) => sum + signal.confidence * signal.occurrences, 0) || 1;
  const categoryTotals = candidates.reduce((totals, signal) => {
    totals[signal.category] = (totals[signal.category] || 0) + signal.confidence * signal.occurrences;
    return totals;
  }, {});

  const categoryDominance = Object.fromEntries(
    Object.entries(categoryTotals).map(([category, value]) => [category, Number((value / totalWeighted).toFixed(2))])
  );

  const sortedCategoryEntries = Object.entries(categoryDominance).sort((a, b) => b[1] - a[1]);
  const dominantCategory = sortedCategoryEntries[0]?.[0] || null;
  const dominantShare = sortedCategoryEntries[0]?.[1] || 0;

  const rankedSignals = candidates
    .map((signal) => {
      const clusterShare = clamp((categoryTotals[signal.category] || 0) / totalWeighted, 0, 1);
      const dominance = clamp(0.16 + clusterShare * 0.56 + signal.confidence * 0.18 + signal.sectionWeight * 0.12, 0, 1);
      const suppressed = dominantShare >= 0.82 && signal.category !== dominantCategory && signal.confidence < 0.45;

      return {
        ...signal,
        dominance: Number(dominance.toFixed(2)),
        clusterShare: Number(clusterShare.toFixed(2)),
        suppressed
      };
    })
    .filter((signal) => !signal.suppressed)
    .sort((a, b) => b.dominance - a.dominance || b.confidence - a.confidence || b.occurrences - a.occurrences)
    .slice(0, MAX_SIGNALS);

  const themes = sortedCategoryEntries.slice(0, 6).map(([category]) => category);

  return {
    signals: rankedSignals,
    dominantCategory,
    categoryDominance,
    themes,
    totalSignals: candidates.length
  };
};
