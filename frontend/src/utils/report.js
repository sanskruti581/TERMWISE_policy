const REPORT_ARTIFACT_PATTERN = /^(termswise analysis report|risk score|privacy grade|risk level|created|summary|detected risks|highlighted clauses|recommendations|positive indicators|category|severity)\s*:?/i;
const SCORE_FRAGMENT_PATTERN = /^\d{1,3}\s*\/\s*100\b/i;
const CATEGORY_PREFIX_PATTERN = /^(data selling|biometric collection|third-party sharing and marketing partners|third-party data sharing|location tracking|cookies and advertising tracking|cookies and tracking|permanent data retention|weak user consent)\s*:?\s+/i;

const cleanHighlightSentence = (value) => {
  const rawSentence = String(value || '').trim();
  if (REPORT_ARTIFACT_PATTERN.test(rawSentence) || SCORE_FRAGMENT_PATTERN.test(rawSentence)) return '';

  const sentence = String(value || '')
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^#{1,6}\s*/g, '')
    .replace(/^[-*•]\s*/g, '')
    .replace(CATEGORY_PREFIX_PATTERN, '')
    .replace(/^(recommendation|recommendations|summary|detected risks|risk score|privacy grade|risk level)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!sentence || REPORT_ARTIFACT_PATTERN.test(sentence) || SCORE_FRAGMENT_PATTERN.test(sentence)) return '';
  const compact = sentence.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.slice(0, 2).join(' ').trim() || sentence;
  if (compact.length <= 320) return compact;
  const boundary = compact.lastIndexOf(' ', 320);
  return `${compact.slice(0, boundary > 180 ? boundary : 320).trim()}...`;
};

export const buildReportText = (analysis) => {
  const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
  const highlights = Array.isArray(analysis.highlights)
    ? analysis.highlights
        .map((highlight) => ({
          category: String(highlight?.category || '').trim(),
          severity: String(highlight?.severity || 'Moderate').trim(),
          sentence: cleanHighlightSentence(highlight?.sentence)
        }))
        .filter((highlight) => highlight.category && highlight.sentence)
        .filter((highlight, index, list) => list.findIndex((item) => item.sentence.toLowerCase() === highlight.sentence.toLowerCase()) === index)
    : [];
  const positives = Array.isArray(analysis.positives) ? analysis.positives : [];
  const score = analysis.score;
  const grade = analysis.grade;

  const riskLines = risks.length
    ? risks.map((risk) => `- ${risk.category}: ${risk.severity} (+${risk.points})`).join('\n')
    : '- No major rule-based risks detected';

  const clauses = highlights.length
    ? highlights
        .map((clause) => {
          return `- [${clause.category} | ${clause.severity}] ${clause.sentence}`;
        })
        .join('\n')
    : '- No dangerous clauses highlighted';

  const recommendations = analysis.recommendations?.length
    ? [...new Set(analysis.recommendations)].map((recommendation) => `- ${recommendation}`).join('\n')
    : '- No recommendations generated';

  const positiveIndicators = positives.length
    ? positives.map((indicator) => `- ${indicator.label}: -${indicator.reduction}`).join('\n')
    : '- No positive indicators detected';

  return `TermsWise Analysis Report

Title: ${analysis.title}
Risk score: ${score}/100
Privacy grade: ${grade}
Risk level: ${analysis.riskLevel}
Created: ${new Date(analysis.createdAt).toLocaleString()}

Summary:
${analysis.summary}

Detected risks:
${riskLines}

Highlighted clauses:
${clauses}

Recommendations:
${recommendations}

Positive indicators:
${positiveIndicators}
`;
};

export const downloadTextReport = (analysis) => {
  const blob = new Blob([buildReportText(analysis)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `termswise-report-${analysis.id || analysis._id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadPdfReport = async (analysis) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(buildReportText(analysis), 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(lines, 14, 16);
  doc.save(`termswise-report-${analysis.id || analysis._id}.pdf`);
};
