import Analysis from '../models/Analysis.js';
import asyncHandler from '../utils/asyncHandler.js';
import { analyzePrivacyText } from '../services/riskAnalysisService.js';
import { generateGroqSummary } from '../services/groqService.js';
import { presentAnalysis } from '../services/analysisPresenter.js';
import { sanitizeText } from '../utils/sanitizeText.js';

export const analyzeText = asyncHandler(async (req, res) => {
  const { text, title, sourceType = 'text' } = req.body;

  if (!['text', 'file'].includes(sourceType)) {
    res.status(400);
    throw new Error('sourceType must be either text or file');
  }

  const cleanText = sanitizeText(text);

  if (!cleanText || cleanText.length < 30) {
    res.status(400);
    throw new Error('Please provide at least 30 characters of policy text');
  }

  if (cleanText.length > 200000) {
    res.status(413);
    throw new Error('Policy text is too large. Please keep analysis input under 200,000 characters.');
  }

  console.log(`Analysis requested: source=${sourceType}, chars=${cleanText.length}`);
  const ruleAnalysis = analyzePrivacyText(cleanText);
  const summary = await generateGroqSummary(cleanText, ruleAnalysis);

  const analysis = await Analysis.create({
    title: sanitizeText(title) || cleanText.slice(0, 70),
    originalText: cleanText,
    extractedText: cleanText,
    summary,
    sourceType,
    ...ruleAnalysis
  });

  console.log(`MongoDB save success: analysis=${analysis._id}, score=${analysis.riskScore}, grade=${analysis.privacyGrade}`);
  res.status(201).json(presentAnalysis(analysis));
});
