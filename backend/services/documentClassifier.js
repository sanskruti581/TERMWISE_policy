import { findMatches, normalizeText } from './phraseMatcher.js';

const categoryDefinitions = [
  {
    type: 'Financial Document',
    strong: [
      /home loan/i,
      /loan agreement/i,
      /\bEMI\b/i,
      /repayment schedule/i,
      /borrower/i,
      /mortgage/i,
      /collateral/i,
      /credit bureau/i
    ],
    weak: [
      /interest rate/i,
      /penal charges?/i,
      /foreclosure/i,
      /collection purpose/i,
      /loan account/i,
      /sanction letter/i
    ]
  },
  {
    type: 'Privacy Policy',
    strong: [
      /privacy policy/i,
      /personal data/i,
      /data controller/i,
      /data subject rights/i,
      /cookies/i,
      /tracking/i,
      /advertisers?/i,
      /analytics/i,
      /targeted advertis/i,
      /location services?/i
    ],
    weak: [
      /privacy notice/i,
      /data protection/i,
      /user data/i,
      /consent/i,
      /cookie preference/i,
      /opt[-\s]?out/i
    ]
  },
  {
    type: 'Terms & Conditions',
    strong: [
      /terms (?:and|&)? conditions?/i,
      /terms of service/i,
      /user agreement/i,
      /acceptable use/i,
      /subscription/i,
      /account registration/i
    ],
    weak: [
      /service terms/i,
      /customer agreement/i,
      /usage policy/i,
      /access to the service/i
    ]
  },
  {
    type: 'Legal Contract',
    strong: [
      /confidentiality/i,
      /governing law/i,
      /indemnif(?:y|ication)/i,
      /warrant(?:y|ies)/i,
      /liabilit(?:y|ies)/i,
      /party(?:ies)? to this agreement/i,
      /effective date/i,
      /term(?:s)? of this agreement/i
    ],
    weak: [
      /agreement/i,
      /contract/i,
      /obligation/i,
      /mutual consent/i,
      /service provider/i
    ]
  },
  {
    type: 'Research/Funding Agreement',
    strong: [
      /funding/i,
      /grant/i,
      /beneficiary/i,
      /procurement/i,
      /state aid/i,
      /implementation report/i,
      /project contract/i,
      /deliverables?/i,
      /consortium/i
    ],
    weak: [
      /sponsor/i,
      /research partner/i,
      /project partner/i,
      /funded by/i
    ]
  },
  {
    type: 'Administrative Document',
    strong: [
      /administrative/i,
      /internal policy/i,
      /memo/i,
      /meeting minutes/i,
      /compliance report/i,
      /notice/i,
      /standard operating procedure/i
    ],
    weak: [
      /report/i,
      /announcement/i,
      /guideline/i,
      /staff policy/i
    ]
  }
];

const calculateStructureScore = (text) => {
  const headingMatches = (text.match(/\b(section|article|clause|agreement|contract|policy)\b/gi) || []).length;
  const separatorMatches = (text.match(/[\r\n]{2,}|[-_=]{3,}/g) || []).length;
  return Math.min(10, Math.round(Math.log1p(headingMatches + separatorMatches) * 3));
};

const scoreCategory = (text, category) => {
  const strongHits = findMatches(text, category.strong).length;
  const weakHits = findMatches(text, category.weak).length;
  const bonus = /\bprivacy policy\b/i.test(text) && category.type === 'Privacy Policy' ? 8 : 0;
  return strongHits * 6 + weakHits * 2 + bonus;
};

const buildConfidence = (bestScore, secondScore, text, category) => {
  if (bestScore < 8) return 36;
  const gap = Math.max(0, bestScore - secondScore);
  const keywordCount = findMatches(text, [...category.strong, ...category.weak]).length;
  const density = Math.min(0.28, keywordCount / Math.max(text.split(/\s+/).length, 90));
  const structureScore = calculateStructureScore(text);
  const confidence = 35 + Math.min(25, bestScore * 2) + Math.min(20, gap * 2) + Math.round(density * 80) + structureScore;
  return Math.max(40, Math.min(95, confidence));
};

export const classifyDocument = (text) => {
  const normalized = normalizeText(text);
  const candidateScores = categoryDefinitions.map((definition) => ({
    type: definition.type,
    score: scoreCategory(normalized, definition)
  }));

  candidateScores.sort((a, b) => b.score - a.score);
  const [best = { type: 'Unknown', score: 0 }, second = { score: 0 }] = candidateScores;
  const documentType = best.score >= 8 ? best.type : 'Unknown';
  const bestCategory = categoryDefinitions.find((definition) => definition.type === best.type) || categoryDefinitions[0];
  const documentTypeConfidence = buildConfidence(best.score, second.score, normalized, bestCategory);

  return {
    documentType,
    documentTypeConfidence,
    categoryScores: candidateScores
  };
};
