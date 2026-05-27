import { normalizeText } from './phraseMatcher.js';

const ROLE_DEFINITIONS = [
  {
    key: 'borrower',
    label: 'Borrower',
    patterns: [
      /\bborrower\b/i,
      /borrower(?:'s|\s+)?(?:shall|may|must)/i,
      /repay(?:ment)? obligation/i,
      /emi/i,
      /installment/i
    ]
  },
  {
    key: 'lender',
    label: 'Lender',
    patterns: [
      /\blender\b/i,
      /bank\b/i,
      /financial institution/i,
      /sanctioned/i,
      /credit(?:or| lender)?/i
    ]
  },
  {
    key: 'contractor',
    label: 'Contractor',
    patterns: [
      /\bcontractor\b/i,
      /\bsubcontractor\b/i,
      /contractor(?:'s|\s+)?(?:shall|may|must)/i,
      /shall (?:provide|maintain|perform)/i
    ]
  },
  {
    key: 'vendor',
    label: 'Vendor',
    patterns: [
      /\bvendor\b/i,
      /supplier\b/i,
      /goods? and services/i,
      /purchase order/i,
      /deliver(?:y)? obligations?/i
    ]
  },
  {
    key: 'purchaser',
    label: 'Purchaser',
    patterns: [
      /\bpurchaser\b/i,
      /buyer/i,
      /customer(?:'s|\s+)?(?:shall|may|must)/i,
      /university\b/i
    ]
  },
  {
    key: 'university',
    label: 'University / Institution',
    patterns: [
      /university\b/i,
      /institute\b/i,
      /college\b/i,
      /department\b/i,
      /institution\b/i
    ]
  },
  {
    key: 'employer',
    label: 'Employer',
    patterns: [
      /\bemployer\b/i,
      /company\b/i,
      /organization\b/i,
      /shall (?:employ|terminate|pay)/i
    ]
  },
  {
    key: 'employee',
    label: 'Employee',
    patterns: [
      /\bemployee\b/i,
      /work(?:er)?\b/i,
      /employment agreement/i,
      /compensation\b/i,
      /benefits?/i
    ]
  },
  {
    key: 'platform',
    label: 'Platform / Service provider',
    patterns: [
      /service provider/i,
      /platform/i,
      /we\b/i,
      /our\b/i,
      /the company\b/i
    ]
  },
  {
    key: 'user',
    label: 'User',
    patterns: [
      /\buser\b/i,
      /\byou\b/i,
      /your\b/i,
      /data subject/i,
      /account holder/i
    ]
  },
  {
    key: 'dataProcessor',
    label: 'Data Processor',
    patterns: [
      /data processor/i,
      /process(?:ing)? (?:your|personal) data/i,
      /service providers? may/i
    ]
  },
  {
    key: 'dataController',
    label: 'Data Controller',
    patterns: [
      /data controller/i,
      /responsible for/i,
      /we may process/i
    ]
  },
  {
    key: 'advertiser',
    label: 'Advertiser',
    patterns: [
      /advertis(?:er|ing)/i,
      /ad network/i,
      /marketing partner/i
    ]
  }
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const countMatches = (text, patterns) => patterns.reduce((sum, p) => sum + (p instanceof RegExp ? (p.test(text) ? 1 : 0) : 0), 0);

const extractRoleEvidence = (text, role) => {
  const evidence = [];
  for (const pattern of role.patterns) {
    const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), 'i');
    if (re.test(text)) evidence.push(String(pattern));
    if (evidence.length >= 3) break;
  }
  return evidence;
};

export const extractActorRoles = (text) => {
  const normalized = normalizeText(text);

  const roleScores = ROLE_DEFINITIONS.reduce((acc, role) => {
    const score = countMatches(normalized, role.patterns);
    if (score > 0) acc[role.key] = score;
    return acc;
  }, {});

  const rolesSorted = Object.entries(roleScores)
    .map(([key, score]) => {
      const def = ROLE_DEFINITIONS.find((r) => r.key === key);
      return {
        key,
        label: def?.label || key,
        score,
        evidence: extractRoleEvidence(normalized, def || { patterns: [] })
      };
    })
    .sort((a, b) => b.score - a.score);

  // Normalize scores to 0..1
  const maxScore = rolesSorted[0]?.score || 1;
  const normalizedRoles = rolesSorted.map((r) => ({ ...r, normalizedScore: clamp01(r.score / maxScore) }));

  const dominantRoles = normalizedRoles.slice(0, 3);

  return {
    dominantRoles,
    roles: normalizedRoles,
    roleScores,
    primaryRole: dominantRoles[0]?.key || 'unknown'
  };
};

