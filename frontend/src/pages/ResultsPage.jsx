import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, BrainCircuit, Clipboard, Download, FileDown, FileSearch, ListChecks, Network, Scale } from 'lucide-react';
import RiskScore from '../components/RiskScore.jsx';
import RiskBreakdown from '../components/RiskBreakdown.jsx';
import { getAnalysis } from '../services/api.js';
import { downloadPdfReport, downloadTextReport } from '../utils/report.js';
import { formatDate, gradeClass } from '../utils/formatters.js';

const REPORT_ARTIFACT_PATTERN = /^(termswise analysis report|risk score|privacy grade|risk level|created|summary|detected risks|highlighted clauses|recommendations|positive indicators|category|severity)\s*:?/i;
const SCORE_FRAGMENT_PATTERN = /^\d{1,3}\s*\/\s*100\b/i;
const CATEGORY_PREFIX_PATTERN = /^(data selling|biometric collection|third-party sharing and marketing partners|third-party data sharing|location tracking|cookies and advertising tracking|cookies and tracking|permanent data retention|weak user consent)\s*:?\s+/i;
const MAX_HIGHLIGHT_LENGTH = 320;
const percent = (value) => Math.round(Number(value || 0) * 100);
const safePercentValue = (...values) => values.map((value) => Number(value || 0)).find((value) => Number.isFinite(value) && value > 0) || 0;

const ConfidenceBar = ({ value, tone = 'bg-emerald-500' }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
    <div className={`h-full rounded-full ${tone} transition-all duration-700 ease-out`} style={{ width: `${Math.max(4, Math.min(100, percent(value)))}%` }} />
  </div>
);

const PipelineStages = ({ stages }) => (
  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {stages.map((stage, index) => (
      <div key={stage.label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{index + 1}</span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stage.label}</span>
      </div>
    ))}
  </div>
);

const DistributionGraph = ({ themes }) => (
  <div className="flex h-28 items-end gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
    {themes.slice(0, 8).map((theme) => (
      <div key={theme.key || theme.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
        <div className="rounded-t bg-slate-900 transition-all duration-700 dark:bg-slate-100" style={{ height: `${Math.max(8, percent(theme.share))}%` }} />
        <span className="truncate text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400" title={theme.label}>{theme.label}</span>
      </div>
    ))}
  </div>
);

const RadarChart = ({ themes }) => {
  const items = themes.slice(0, 6);
  if (!items.length) return null;
  const center = 50;
  const radius = 38;
  const points = items.map((theme, index) => {
    const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
    const themeRadius = radius * Math.max(0.12, Number(theme.semanticDominance || theme.share || 0));
    return `${center + Math.cos(angle) * themeRadius},${center + Math.sin(angle) * themeRadius}`;
  }).join(' ');

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
      <svg viewBox="0 0 100 100" className="mx-auto h-44 w-full max-w-xs">
        {[0.33, 0.66, 1].map((ring) => (
          <circle key={ring} cx="50" cy="50" r={radius * ring} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
        ))}
        {items.map((_, index) => {
          const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
          return <line key={index} x1="50" y1="50" x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />;
        })}
        <polygon points={points} fill="rgba(16, 185, 129, 0.28)" stroke="rgb(5, 150, 105)" strokeWidth="1.6" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((theme) => <span key={theme.key || theme.label} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{theme.label}</span>)}
      </div>
    </div>
  );
};

const compactSentence = (value) => {
  const rawSentence = String(value || '').trim();
  if (REPORT_ARTIFACT_PATTERN.test(rawSentence) || SCORE_FRAGMENT_PATTERN.test(rawSentence)) return '';

  const sentence = String(value || '')
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^#{1,6}\s*/g, '')
    .replace(/^[-*•]\s*/g, '')
    .replace(CATEGORY_PREFIX_PATTERN, '')
    .replace(/\*\*/g, '')
    .replace(/^(recommendation|recommendations|summary|detected risks|risk score|privacy grade|risk level)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sentence || REPORT_ARTIFACT_PATTERN.test(sentence) || SCORE_FRAGMENT_PATTERN.test(sentence)) return '';

  const parts = sentence.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) || [sentence];
  const compact = parts.slice(0, 2).join(' ');

  if (compact.length <= MAX_HIGHLIGHT_LENGTH) return compact;
  const boundary = compact.lastIndexOf(' ', MAX_HIGHLIGHT_LENGTH);
  return `${compact.slice(0, boundary > 180 ? boundary : MAX_HIGHLIGHT_LENGTH).trim()}...`;
};

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const validateHighlights = (value) => {
  if (!Array.isArray(value)) {
    console.warn('TermsWise report validation: highlights must be an array.', value);
    return [];
  }

  const highlights = value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const category = String(item.category || '').trim();
      const severity = String(item.severity || 'Moderate').trim();
      const sentence = compactSentence(item.sentence);
      const intentTypes = Array.isArray(item.intentTypes) ? item.intentTypes.filter(Boolean) : [];
      const badges = Array.isArray(item.badges) ? item.badges.filter(Boolean) : [];
      if (!category || !sentence) return null;
      return {
        category,
        severity,
        sentence,
        intentTypes,
        badges,
        clauseType: String(item.clauseType || '').trim(),
        sensitivity: String(item.sensitivity || '').trim(),
        explanation: String(item.explanation || '').trim(),
        dimensions: item.dimensions && typeof item.dimensions === 'object' ? item.dimensions : null
      };
    })
    .filter(Boolean);

  if (highlights.length !== value.length) {
    console.warn('TermsWise report validation: malformed highlights were filtered.', value);
  }

  return uniqueBy(highlights, (item) => item.sentence.toLowerCase()).slice(0, 8);
};

const normalizeReport = (analysis) => {
  const risks = uniqueBy(Array.isArray(analysis.risks) ? analysis.risks : [], (risk) => risk.category).filter((risk) => risk.category);
  const positives = uniqueBy(Array.isArray(analysis.positives) ? analysis.positives : [], (item) => item.label).filter((item) => item.label);

  const domainConfidence = safePercentValue(analysis.documentDomainConfidence, analysis.documentTypeConfidence, analysis.documentSubtypeConfidence);
  const subtypeConfidence = Math.min(domainConfidence || 0, safePercentValue(analysis.documentSubtypeConfidence, domainConfidence ? domainConfidence - 8 : 0));
  const documentTypeConfidence = safePercentValue(analysis.documentTypeConfidence, subtypeConfidence, domainConfidence);

  return {
    id: analysis.id,
    title: analysis.title || 'Untitled analysis',
    createdAt: analysis.createdAt,
    score: analysis.score,
    grade: analysis.grade,
    riskLevel: analysis.riskLevel,
    adaptiveRiskProfile: analysis.adaptiveRiskProfile || null,
    documentType: analysis.documentType || 'Unknown',
    documentTypeConfidence,
    analysisConfidence: String(analysis.analysisConfidence || 'Medium'),
    analysisReliability: String(analysis.analysisReliability || analysis.analysisConfidence || 'Medium'),
    analysisReliabilityScore: Number(analysis.analysisReliabilityScore || 0),
    contextSignals: Array.isArray(analysis.contextSignals) ? analysis.contextSignals : [],
    contextualThemes: Array.isArray(analysis.contextualThemes) ? analysis.contextualThemes : [],
    dominantContextCategory: analysis.dominantContextCategory || null,
    themeDominance: Array.isArray(analysis.themeDominance) ? analysis.themeDominance : [],
    contractThemes: Array.isArray(analysis.contractThemes) ? analysis.contractThemes : [],
    sectionBreakdown: Array.isArray(analysis.sectionBreakdown) ? analysis.sectionBreakdown : [],
    documentDomain: analysis.documentDomain || analysis.documentType || 'Unknown',
    documentDomainConfidence: domainConfidence,
    documentSubtype: analysis.documentSubtype || analysis.documentType || 'Unknown',
    documentSubtypeConfidence: subtypeConfidence,
    dominantLegalThemes: Array.isArray(analysis.dominantLegalThemes) ? analysis.dominantLegalThemes : [],
    dominantDomain: analysis.dominantDomain || null,
    domainDominance: Array.isArray(analysis.domainDominance) ? analysis.domainDominance : [],
    secondaryDomains: Array.isArray(analysis.secondaryDomains) ? analysis.secondaryDomains : [],
    weakDomains: Array.isArray(analysis.weakDomains) ? analysis.weakDomains : [],
    semanticOwnership: analysis.semanticOwnership || null,
    semanticNarrative: String(analysis.semanticNarrative || '').trim(),
    analysisMode: analysis.analysisMode || null,
    pipelineStages: Array.isArray(analysis.pipelineStages) ? analysis.pipelineStages : [],
    classificationReasoning: analysis.classificationReasoning || null,
    clauseIntents: Array.isArray(analysis.clauseIntents) ? analysis.clauseIntents : [],
    clauseTypeSummary: analysis.clauseTypeSummary && typeof analysis.clauseTypeSummary === 'object' ? analysis.clauseTypeSummary : {},
    financialClassification: analysis.financialClassification || null,
    semanticContradictions: Array.isArray(analysis.semanticContradictions) ? analysis.semanticContradictions : [],
    adaptiveRecommendations: Array.isArray(analysis.adaptiveRecommendations) ? analysis.adaptiveRecommendations : [],
    summary: String(analysis.summary || '').trim(),
    risks,
    highlights: validateHighlights(analysis.highlights),
    recommendations: [...new Set((Array.isArray(analysis.recommendations) ? analysis.recommendations : []).filter(Boolean))],
    positives
  };
};

const ResultsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!analysis);
  const [showReasoning, setShowReasoning] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    if (analysis) return;

    const loadAnalysis = async () => {
      try {
        setAnalysis(await getAnalysis(id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load analysis.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [analysis, id]);

  if (loading) {
    return <div className="card p-8 text-center text-slate-600 dark:text-slate-300">Loading analysis...</div>;
  }

  if (!analysis) {
    return <div className="card p-8 text-center text-slate-600 dark:text-slate-300">Analysis not found.</div>;
  }

  const copySummary = async () => {
    await navigator.clipboard.writeText(analysis.summary || '');
    toast.success('Summary copied');
  };

  const exportPdf = async () => {
    try {
      await downloadPdfReport(analysis);
    } catch {
      toast.error('Unable to create PDF report.');
    }
  };

  const report = normalizeReport(analysis);
  const scoreProfile = report.adaptiveRiskProfile || {
    label: 'Privacy Risk Score',
    score: report.score,
    description: 'Measures detected risk signals and positive protections.',
    grade: report.grade,
    level: report.riskLevel
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(report.createdAt)}</p>
            <h1 className="mt-1 text-3xl font-bold">{report.title}</h1>
            {report.semanticNarrative ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{report.semanticNarrative}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Document type: {report.documentType || 'Unknown'}</span>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Domain: {report.documentDomain || 'Unknown'}</span>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Subtype: {report.documentSubtype || 'General legal document'}</span>
            {report.analysisMode?.label ? <span className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{report.analysisMode.label}</span> : null}
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Confidence: {report.documentTypeConfidence}%</span>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Subtype confidence: {report.documentSubtypeConfidence}%</span>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Analysis reliability: {report.analysisReliability}</span>
          </div>
          {report.dominantDomain ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Dominant domain: {report.dominantDomain}</span>
              <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">Domain confidence: {report.documentDomainConfidence}%</span>
            </div>
          ) : null}
        </div>

        {advancedMode ? (
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileSearch size={18} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-semibold">Advanced analysis panel</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Semantic hierarchy</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{report.documentDomain}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{report.documentSubtype}</p>
                {report.analysisMode?.focus?.length ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Focus: {report.analysisMode.focus.slice(0, 4).join(', ')}</p> : null}
                <div className="mt-3"><ConfidenceBar value={report.documentSubtypeConfidence / 100} tone="bg-emerald-500" /></div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confidence reasoning</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Domain {report.documentDomainConfidence}% / subtype {report.documentSubtypeConfidence}% / reliability {report.analysisReliabilityScore}%</p>
                <div className="mt-3"><ConfidenceBar value={report.analysisReliabilityScore / 100} tone="bg-violet-500" /></div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Clause-type breakdown</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(report.clauseTypeSummary).length ? Object.entries(report.clauseTypeSummary).map(([type, count]) => (
                    <span key={type} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{type}: {count}</span>
                  )) : <span className="text-sm text-slate-500 dark:text-slate-400">No typed clauses detected.</span>}
                </div>
              </div>
              {report.semanticContradictions.length ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">Suppressed contradictions</p>
                  <p className="mt-2 text-sm text-amber-950 dark:text-amber-100">{report.semanticContradictions.slice(0, 2).map((item) => item.label).join(', ')}</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <BrainCircuit size={18} className="text-emerald-600 dark:text-emerald-300" />
            <span>{advancedMode ? 'Advanced Semantic Analysis' : 'Basic View'}</span>
          </div>
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button type="button" className={`rounded px-3 py-1.5 text-sm font-semibold ${!advancedMode ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setAdvancedMode(false)}>Basic View</button>
            <button type="button" className={`rounded px-3 py-1.5 text-sm font-semibold ${advancedMode ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setAdvancedMode(true)}>Advanced Semantic Analysis</button>
          </div>
        </div>

        {report.documentType !== 'Privacy Policy' && report.documentTypeConfidence >= 40 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
            <strong>Note:</strong> This document appears to be a <span className="font-semibold">{report.documentType}</span> rather than a consumer privacy policy. Privacy-risk analysis may be less accurate for this type of document.
          </div>
        )}
        {report.themeDominance.length ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-200">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Detected Legal Themes</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{report.themeDominance.length} themes</span>
            </div>
            <div className="mt-3 space-y-3">
              {report.themeDominance.map((theme) => (
                <div key={theme.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>{theme.label}</span>
                    <span>{percent(theme.confidence || theme.share)}% confidence</span>
                  </div>
                  <ConfidenceBar value={theme.confidence || theme.share} tone="bg-slate-900 dark:bg-slate-200" />
                  {advancedMode ? <p className="text-xs text-slate-500 dark:text-slate-400">Relevance {percent(theme.relevance || theme.share)}% / dominance {percent(theme.semanticDominance || theme.share)}%</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => downloadTextReport(analysis)}><Download size={17} /> Text</button>
          <button type="button" className="btn-secondary" onClick={exportPdf}><FileDown size={17} /> PDF</button>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="card p-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{scoreProfile.label}</p>
          <RiskScore score={scoreProfile.score} />
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{scoreProfile.description}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Adaptive grade</p>
          <div className="mt-3 flex items-center gap-3">
            <span className={`rounded-md px-4 py-2 text-4xl font-black ${gradeClass(scoreProfile.grade || report.grade)}`}>{scoreProfile.grade || report.grade}</span>
            <div>
              <p className="text-xl font-bold">{scoreProfile.level || report.riskLevel}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {report.risks.length
                  ? `${report.risks.length} risk categories detected`
                  : report.contextualThemes.length
                    ? `This document mainly contains ${report.contextualThemes.join(', ')} language rather than consumer privacy tracking or advertising clauses.`
                    : 'No major consumer privacy risks detected'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {report.pipelineStages.length ? (
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks size={18} className="text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-xl font-semibold">Analysis pipeline</h2>
          </div>
          <PipelineStages stages={report.pipelineStages} />
        </section>
      ) : null}

      {advancedMode && report.themeDominance.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Network size={18} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-semibold">Semantic radar</h2>
            </div>
            <RadarChart themes={report.themeDominance} />
          </div>
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-semibold">Theme distribution</h2>
            </div>
            <DistributionGraph themes={report.themeDominance} />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Risk breakdown</h2>
        <RiskBreakdown risks={report.risks} />
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-xl font-semibold">Detected legal themes</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">{report.dominantLegalThemes.length || 0}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {report.dominantLegalThemes.length ? report.dominantLegalThemes.map((theme) => (
            <div key={theme.key || theme.label} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{theme.label}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{percent(theme.confidence || theme.share)}%</span>
              </div>
              <div className="mt-3"><ConfidenceBar value={theme.confidence || theme.share} tone="bg-sky-500" /></div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Relevance {percent(theme.relevance || theme.share)}% / semantic dominance {percent(theme.semanticDominance || theme.share)}%</p>
            </div>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No dominant legal themes were strong enough to report.</p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Detected context signals</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">{report.contextSignals.length || 0}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {report.contextSignals.length ? report.contextSignals.map((signal) => {
            const label = typeof signal === 'string' ? signal : signal.label;
            const category = typeof signal === 'string' ? 'context' : signal.category;
            const confidence = typeof signal === 'string' ? null : `${Math.round((signal.confidence || 0) * 100)}%`;
            const importance = typeof signal === 'string' ? null : `${Math.round((signal.contextualWeight || 0) * 100)}%`;

            return (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
                  {confidence && <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">{confidence}</span>}
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{category}</p>
                {typeof signal !== 'string' ? <div className="mt-3"><ConfidenceBar value={signal.adjustedConfidence || signal.confidence} /></div> : null}
                {importance && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Importance {importance}</p>}
                {advancedMode && typeof signal !== 'string' && signal.dominance ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Dominance {percent(signal.dominance)}% / section weight {percent(signal.sectionWeight)}%</p>
                ) : null}
              </div>
            );
          }) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No strong context signals were identified. The analysis is still based on document structure and term patterns.</p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Why was this classified this way?</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open the semantic explanation to see the strongest signals, dominant context, and reasoning behind the document classification.</p>
          </div>
          <button
            type="button"
            className="btn-secondary px-4"
            onClick={() => setShowReasoning((current) => !current)}
          >
            {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
          </button>
        </div>
        {showReasoning && (
          <div className="mt-5 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            {report.classificationReasoning?.strongSignals?.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Strongest semantic signals</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {report.classificationReasoning.strongSignals.map((signal) => (
                    <li key={signal.label}>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{signal.label}</span> - {signal.occurrences} occurrences, {Math.round(signal.confidence * 100)}% confidence, dominance {Math.round(signal.dominance * 100)}%
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No strong signal explanation is available for this document.</p>
            )}
            {report.classificationReasoning?.rankedThemes?.length && (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Detected operational themes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.classificationReasoning.rankedThemes.map((theme) => (
                    <span key={theme} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">{theme}</span>
                  ))}
                </div>
              </div>
            )}
            {advancedMode && report.classificationReasoning?.confidenceReasoning?.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Confidence reasoning</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {report.classificationReasoning.confidenceReasoning.slice(0, 6).map((item) => (
                    <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/30">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{percent(item.finalConfidence)}%</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.formula}</p>
                      <div className="mt-3"><ConfidenceBar value={item.finalConfidence} tone="bg-violet-500" /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {advancedMode && report.classificationReasoning?.suppressedCategories?.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Suppressed categories</p>
                <div className="mt-3 space-y-2">
                  {report.classificationReasoning.suppressedCategories.slice(0, 4).map((item) => (
                    <p key={`${item.label}-${item.category}`} className="rounded-md bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{item.reason}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {report.classificationReasoning?.conclusion && (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Conclusion</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.classificationReasoning.conclusion}</p>
              </div>
            )}
            {report.classificationReasoning?.riskSummary && (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Risk summary</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.classificationReasoning.riskSummary}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Plain-English summary</h2>
            <button type="button" className="btn-secondary px-3" onClick={copySummary} aria-label="Copy summary"><Clipboard size={17} /></button>
          </div>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-700 dark:text-slate-200">{report.summary || 'No summary was generated.'}</p>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold">Highlighted clauses</h2>
          <div className="mt-4 space-y-3">
            {report.highlights.length ? report.highlights.map((clause) => (
              <div key={`${clause.category}-${clause.sentence}`} className="rounded-md border-l-4 border-sky-500 bg-sky-50 p-3 dark:bg-sky-950/30">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-100">{clause.category}</span>
                  {clause.clauseType ? <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">{clause.clauseType}</span> : null}
                  <span className="inline-flex rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-100">{clause.sensitivity || clause.severity}</span>
                </div>
                {clause.badges?.length ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {clause.badges.map((badge) => <span key={badge} className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">{badge}</span>)}
                  </div>
                ) : null}
                {clause.intentTypes?.length ? (
                  <p className="mb-2 text-xs uppercase tracking-wide text-sky-700 dark:text-sky-200">Intent: {clause.intentTypes.join(', ')}</p>
                ) : null}
                <p className="text-sm leading-6 text-sky-950 dark:text-sky-100">{clause.sentence}</p>
                {clause.explanation ? <p className="mt-2 text-xs leading-5 text-sky-800 dark:text-sky-200">{clause.explanation}</p> : null}
                {advancedMode && clause.dimensions ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(clause.dimensions).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span>{percent(value)}%</span>
                        </div>
                        <ConfidenceBar value={value} tone="bg-sky-500" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )) : <p className="text-sm text-slate-500 dark:text-slate-400">No high-risk or operationally significant clauses were highlighted.</p>}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Recommendations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(report.adaptiveRecommendations.length ? report.adaptiveRecommendations : report.recommendations.map((text) => ({ priority: 'Medium', text }))).map((recommendation) => (
            <div key={recommendation.text || recommendation} className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
              <span className="mb-2 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100">{recommendation.priority || 'Medium'}</span>
              <p>{recommendation.text || recommendation}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Positive indicators</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {report.positives.length ? report.positives.map((indicator) => (
            <div key={indicator.label} className="rounded-md bg-sky-50 p-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{indicator.label}</span>
                <span className="rounded-md bg-white/80 px-2 py-1 text-xs font-bold text-sky-800 dark:bg-sky-900/60 dark:text-sky-100">-{indicator.reduction}</span>
              </div>
              {indicator.matches?.length > 0 && <p className="mt-2 text-xs opacity-80">Matched: {indicator.matches.join(', ')}</p>}
            </div>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No score-reducing privacy protections were detected.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResultsPage;
