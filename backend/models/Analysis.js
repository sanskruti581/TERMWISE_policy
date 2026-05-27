import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    snippet: { type: String },
    page: { type: Number },
    paragraphIndex: { type: Number },
    sentenceIndex: { type: Number },
    sectionIndex: { type: Number },
    startOffset: { type: Number },
    endOffset: { type: Number },
    triggerType: { type: String },
    evidenceStrength: { type: String },
    ocrConfidence: { type: Number },
    evidenceSource: { type: String }
  },
  { _id: false }
);

const detectedRiskSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    severity: { type: String, enum: ['Safe', 'Moderate', 'Risky', 'High Risk'], required: true },
    points: { type: Number, required: true },
    recommendation: { type: String },
    matches: [{ type: String }],
    clauses: [{ type: String }],
    evidence: [evidenceSchema]
  },
  { _id: false }
);



const highlightedClauseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },

    severity: { type: String, enum: ['Safe', 'Informational', 'Low relevance', 'Moderate', 'Moderate operational impact', 'Consumer-sensitive', 'Risky', 'High Risk', 'High privacy concern'], default: 'Moderate' },

    sentence: { type: String, required: true },
    intentTypes: [{ type: String }],
    clauseType: { type: String },
    sensitivity: { type: String },
    explanation: { type: String },
    badges: [{ type: String }],
    dimensions: { type: mongoose.Schema.Types.Mixed },
    evidence: [evidenceSchema]
  },
  { _id: false }
);


const positiveIndicatorSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    reduction: { type: Number, required: true },
    matches: [{ type: String }]
  },
  { _id: false }
);

const contextSignalSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    category: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    adjustedConfidence: { type: Number, min: 0, max: 1 },
    semanticConfidence: { type: Number, min: 0, max: 1 },
    contextualWeight: { type: Number, required: true, min: 0, max: 1 },
    adjustedWeight: { type: Number, min: 0, max: 1 },
    occurrences: { type: Number, required: true },
    dominance: { type: Number, required: true, min: 0, max: 1 },
    clusterShare: { type: Number, min: 0, max: 1 },
    sectionWeight: { type: Number, min: 0, max: 1 },
    localMatch: { type: Number, min: 0, max: 1 },
    domainDominance: { type: Number, min: 0, max: 1 },
    suppressionFactor: { type: Number, min: 0, max: 1 },
    proportionalInfluence: { type: Number, min: 0, max: 1 },
    semanticDomain: { type: String },
    suppressed: { type: Boolean, default: false },
    suppressionReason: { type: String }
  },
  { _id: false }
);

const intentClauseSchema = new mongoose.Schema(
  {
    clause: { type: String, required: true },
    intents: [
      {
        intent: { type: String, required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 },
        evidenceCount: { type: Number, required: true, min: 0 }
      }
    ],
    certainty: { type: Number, min: 0, max: 100 }
  },
  { _id: false }
);

const explanationSchema = new mongoose.Schema(
  {
    strongSignals: [
      {
        label: String,
        category: String,
        confidence: Number,
        occurrences: Number,
        dominance: Number,
        sectionWeight: Number,
        domainDominance: Number,
        suppressionFactor: Number,
        proportionalInfluence: Number,
        suppressionReason: String
      }
    ],
    rankedThemes: [{ type: String }],
    weightedSections: [
      {
        label: String,
        sectionWeight: Number,
        dominance: Number
      }
    ],
    semanticDominance: [{ type: mongoose.Schema.Types.Mixed }],
    suppressedCategories: [{ type: mongoose.Schema.Types.Mixed }],
    semanticIsolation: { type: mongoose.Schema.Types.Mixed },
    contextualReasoning: String,
    confidenceReasoning: [{ type: mongoose.Schema.Types.Mixed }],
    conclusion: String,
    evidence: [{ type: String }],
    riskSummary: String,
    positiveIndicators: [
      {
        label: String,
        reduction: Number,
        matches: [{ type: String }]
      }
    ]
  },
  { _id: false }
);

const themeDominanceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    share: { type: Number, required: true, min: 0, max: 1 },
    confidence: { type: Number, min: 0, max: 1 },
    relevance: { type: Number, min: 0, max: 1 },
    semanticDominance: { type: Number, min: 0, max: 1 }
  },
  { _id: false }
);

const sectionBreakdownSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    topTheme: { type: String, required: true },
    theme: { type: String, required: true },
    share: { type: Number, required: true, min: 0, max: 1 },
    summary: { type: String },
    semanticImportance: { type: Number, min: 0, max: 1 },
    themeConfidence: { type: Number, min: 0, max: 1 }
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled analysis' },
    originalText: { type: String, required: true },
    extractedText: { type: String, required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    privacyGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], required: true },
    riskLevel: { type: String, enum: ['Safe', 'Moderate', 'Risky', 'High Risk', 'Severe Risk'], required: true },
    detectedRisks: [detectedRiskSchema],
    highlightedClauses: [highlightedClauseSchema],
    recommendations: [{ type: String }],
    adaptiveRecommendations: [{ type: mongoose.Schema.Types.Mixed }],
    positiveIndicators: [positiveIndicatorSchema],
    documentType: {
      type: String,
      enum: ['Privacy Policy', 'Terms & Conditions', 'Legal Contract', 'Financial Document', 'Research/Funding Agreement', 'Administrative Document', 'Unknown'],
      default: 'Unknown'
    },
    documentDomain: {
      type: String,
      enum: ['Legal Documents', 'Financial/Loan Agreements', 'Consumer Privacy Policies', 'Research/Funding Agreements', 'Compliance Documents', 'Operational Documents', 'Administrative Documents', 'Miscellaneous', 'Unknown'],
      default: 'Unknown'
    },
    documentDomainConfidence: { type: Number, min: 0, max: 100, default: 0 },
    documentSubtype: { type: String, default: 'Legal/contract document' },
    documentSubtypeConfidence: { type: Number, min: 0, max: 100, default: 0 },
    analysisConfidence: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    analysisReliability: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    analysisReliabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    contextSignals: [contextSignalSchema],
    contextualThemes: [{ type: String }],
    dominantContextCategory: { type: String },
    financialClassification: { type: mongoose.Schema.Types.Mixed },
    analysisMode: { type: mongoose.Schema.Types.Mixed },
    adaptiveRiskProfile: { type: mongoose.Schema.Types.Mixed },
    themeDominance: [themeDominanceSchema],
    dominantLegalThemes: [themeDominanceSchema],
    dominantDomain: { type: String },
    domainDominance: [themeDominanceSchema],
    secondaryDomains: [themeDominanceSchema],
    weakDomains: [themeDominanceSchema],
    semanticIsolation: { type: mongoose.Schema.Types.Mixed },
    semanticOwnership: {
      dominant: [themeDominanceSchema],
      secondary: [themeDominanceSchema],
      weak: [themeDominanceSchema]
    },
    contractThemes: [{ type: String }],
    sectionBreakdown: [sectionBreakdownSchema],
    classificationReasoning: explanationSchema,
    clauseIntents: [intentClauseSchema],
    clauseTypeSummary: { type: mongoose.Schema.Types.Mixed },
    semanticContradictions: [{ type: mongoose.Schema.Types.Mixed }],
    summary: { type: String, default: '' },
    sourceType: { type: String, enum: ['text', 'file'], default: 'text' }
  },
  { timestamps: true }
);

export default mongoose.model('Analysis', analysisSchema);
