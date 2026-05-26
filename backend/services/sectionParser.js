import { normalizeText, findMatches } from './phraseMatcher.js';

const SECTION_HEADING_PATTERN = /^\s*(?:(?:section|article|clause)\s+)?(?:\d+(?:\.\d+)*|[ivxlcdm]+)\s*[\.)-]?\s+([A-Z][A-Za-z0-9 &'"()/-]{3,120})(?:\s*[:-])?\s*$/i;
const HEADING_ONLY_PATTERN = /^[A-Z0-9][A-Z0-9 &'"()/-]{5,120}$/;
const NUMBERED_START_PATTERN = /(?:^|\n)\s*(?=(?:(?:section|article|clause)\s+)?(?:\d+(?:\.\d+)*|[ivxlcdm]+)\s*[\.)-]?\s+[A-Z][A-Za-z0-9 &'"()/-]{3,120}(?:\s*[:-])?)/gi;

const themeDefinitions = {
  commercial: {
    label: 'Commercial obligations',
    patterns: [/sales?/i, /purchase(?: order)?/i, /billing/i, /pricing/i, /purchase price/i, /order/i, /subscription/i]
  },
  payment: {
    label: 'Payment obligations',
    patterns: [/payment(?:s| terms)?/i, /invoice/i, /amount payable/i, /due date/i, /billing/i, /remittance/i, /currency/i, /fee(?:s)?/i]
  },
  repayment: {
    label: 'Repayment obligations',
    patterns: [/\bEMI\b/i, /equated monthly instal(?:l)?ment/i, /repayment schedule/i, /repayment/i, /instal(?:l)?ment/i, /borrower shall pay/i]
  },
  mortgage: {
    label: 'Mortgage/security',
    patterns: [/mortgage/i, /collateral/i, /security interest/i, /hypothecation/i, /secured asset/i, /charge over/i]
  },
  penalties: {
    label: 'Penal charges/default',
    patterns: [/penal(?:ty| charges?)/i, /late payment/i, /default interest/i, /overdue amount/i, /bounce charges?/i, /foreclosure/i]
  },
  loanServicing: {
    label: 'Loan servicing',
    patterns: [/loan servicing/i, /prepayment/i, /part payment/i, /statement of account/i, /servicer/i, /foreclosure/i]
  },
  creditDisclosure: {
    label: 'Credit bureau disclosure',
    patterns: [/credit bureau/i, /\bCIBIL\b/i, /authorized to disclose/i, /disclose information/i, /transunion/i]
  },
  collectionRecovery: {
    label: 'Collection/recovery',
    patterns: [/collection purpose/i, /recovery agent/i, /debt collection/i, /third parties appointed/i, /recover(?:y)? proceedings?/i]
  },
  liability: {
    label: 'Warranty/liability',
    patterns: [/warrant(?:y|ies)/i, /liabilit(?:y|ies)/i, /limitation(?:s)? of liability/i, /disclaim(?:er|ers)?/i, /damages?/i, /cap on liability/i]
  },
  indemnification: {
    label: 'Indemnification',
    patterns: [/indemnif(?:y|ication|ied)/i, /hold harmless/i, /defend and indemnify/i, /third[-\s]?party claims?/i]
  },
  termination: {
    label: 'Termination conditions',
    patterns: [/termination/i, /terminate this agreement/i, /notice of termination/i, /material breach/i, /expiration/i, /surviv(?:e|al)/i]
  },
  confidentiality: {
    label: 'Confidentiality clauses',
    patterns: [/confidentiality/i, /non[-\s]?disclosure/i, /confidential information/i, /sensitive information/i, /privacy of information/i]
  },
  privacy: {
    label: 'Privacy references',
    patterns: [/personal data/i, /data protection/i, /data subject rights/i, /gdpr/i, /privacy policy/i, /data controller/i, /data processor/i, /consent/i, /cookies?/i, /tracking/i]
  },
  export: {
    label: 'Export restrictions',
    patterns: [/export control/i, /sanctions?/i, /customs?/i, /trade control/i, /approved destination/i, /export license/i, /restricted country/i]
  },
  governingLaw: {
    label: 'Governing law',
    patterns: [/governing law/i, /choice of law/i, /law of [A-Za-z ]+/i, /venue/i, /jurisdiction/i, /governed by/i]
  },
  disputeResolution: {
    label: 'Dispute resolution',
    patterns: [/dispute resolution/i, /arbitration/i, /mediation/i, /litigation/i, /court of competent/i, /settlement/i]
  },
  intellectualProperty: {
    label: 'Intellectual property',
    patterns: [/intellectual property/i, /patent/i, /copyright/i, /trademark/i, /license/i, /ownership/i, /proprietary/i]
  },
  forceMajeure: {
    label: 'Force majeure',
    patterns: [/force majeure/i, /act of god/i, /beyond (?:our|the parties') control/i, /unforeseeable circumstance/i]
  },
  delivery: {
    label: 'Delivery obligations',
    patterns: [/deliver(?:y|ies)/i, /shipment/i, /lead time/i, /shipment date/i, /acceptance criteria/i, /delivery schedule/i, /delivery obligations?/i]
  },
  compliance: {
    label: 'Compliance obligations',
    patterns: [/compliance obligations?/i, /regulatory compliance/i, /statutory/i, /audit/i, /lawful/i, /regulat(?:ion|ory)/i, /data protection officer/i]
  },
  operational: {
    label: 'Operational obligations',
    patterns: [/service provider/i, /vendor/i, /supplier/i, /subcontractor/i, /performance/i, /service levels?/i, /maintenance/i]
  },
  researchFunding: {
    label: 'Research/funding',
    patterns: [/funding/i, /grant/i, /beneficiary/i, /procurement/i, /state aid/i, /project deliverables?/i, /consortium/i, /sponsor/i]
  },
  miscellaneous: {
    label: 'Miscellaneous',
    patterns: [/.*/]
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const detectHeading = (line) => {
  const candidate = String(line || '').trim();
  if (!candidate) return null;
  if (SECTION_HEADING_PATTERN.test(candidate) && candidate.length < 140) return candidate.replace(/[:-]$/, '').trim();
  if (HEADING_ONLY_PATTERN.test(candidate) && candidate === candidate.toUpperCase() && candidate.length < 90) return candidate.trim();
  return null;
};

const scoreSectionThemes = (text, heading) => {
  const normalized = normalizeText(`${heading} ${text}`);
  const headingText = normalizeText(heading);
  const themeScores = Object.entries(themeDefinitions).reduce((result, [key, def]) => {
    const headingMatches = key === 'miscellaneous' ? 0 : findMatches(headingText, def.patterns).length;
    const bodyMatches = key === 'miscellaneous' ? 0 : findMatches(normalized, def.patterns).length;
    result[key] = bodyMatches + headingMatches * 2.1;
    return result;
  }, {});

  const nonZeroThemes = Object.entries(themeScores).filter(([key, score]) => key !== 'miscellaneous' && score > 0);
  if (!nonZeroThemes.length) {
    return {
      topTheme: 'miscellaneous',
      themeConfidence: 0.34,
      themeScores: { miscellaneous: 1 }
    };
  }

  const sorted = nonZeroThemes.sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const secondScore = sorted[1]?.[1] || 0;
  const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0);
  const separation = (topScore - secondScore) / Math.max(topScore, 1);

  return {
    topTheme: sorted[0][0],
    themeConfidence: Number(clamp(0.28 + (topScore / Math.max(totalScore, 1)) * 0.5 + separation * 0.18, 0.26, 0.88).toFixed(2)),
    themeScores
  };
};

const splitIntoBlocks = (text) => {
  const source = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!source) return [];

  const numberedMatches = [...source.matchAll(NUMBERED_START_PATTERN)];
  if (numberedMatches.length >= 2) {
    return numberedMatches
      .map((match, index) => source.slice(match.index, numberedMatches[index + 1]?.index ?? source.length).trim())
      .filter(Boolean);
  }

  const paragraphBlocks = source.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (paragraphBlocks.length > 1) return paragraphBlocks;

  return source
    .split(/(?=\b(?:section|article|clause)\s+\d+(?:\.\d+)*\b)/i)
    .map((block) => block.trim())
    .filter(Boolean);
};

export const parseDocumentSections = (text) => {
  const blocks = splitIntoBlocks(text);
  const totalWords = blocks.reduce((sum, block) => sum + (String(block).split(/\s+/).filter(Boolean).length || 0), 0) || 1;

  return blocks.map((block, index) => {
    const lines = String(block).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const heading = detectHeading(firstLine);
    const sectionText = heading ? lines.slice(1).join(' ') : lines.join(' ');
    const wordCount = Math.max(1, String(sectionText || firstLine).split(/\s+/).filter(Boolean).length);
    const share = Number((wordCount / totalWords).toFixed(3));
    const { topTheme, themeConfidence, themeScores } = scoreSectionThemes(sectionText, heading || firstLine || 'General');

    return {
      index,
      heading: heading || (firstLine.length < 80 ? firstLine : 'General terms'),
      text: sectionText.trim() || firstLine,
      wordCount,
      share,
      topTheme,
      themeConfidence,
      themeScores,
      summary: (sectionText.trim() || firstLine).split(/(?:[.!?])\s+/)[0] || 'General terms'
    };
  });
};

export const analyzeDocumentSections = (text) => {
  const sections = parseDocumentSections(text);
  return {
    sections,
    sectionCount: sections.length
  };
};
