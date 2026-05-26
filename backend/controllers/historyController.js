import Analysis from '../models/Analysis.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { presentAnalysis, presentAnalysisList } from '../services/analysisPresenter.js';

export const getHistory = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  const query = search
    ? { $or: [{ title: new RegExp(search, 'i') }, { extractedText: new RegExp(search, 'i') }] }
    : {};

  const analyses = await Analysis.find(query)
    .select('-originalText')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(presentAnalysisList(analyses));
});

export const getAnalysisById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid analysis id');
  }

  const analysis = await Analysis.findById(req.params.id);
  if (!analysis) {
    res.status(404);
    throw new Error('Analysis not found');
  }
  res.json(presentAnalysis(analysis));
});

export const deleteAnalysis = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid analysis id');
  }

  const analysis = await Analysis.findByIdAndDelete(req.params.id);
  if (!analysis) {
    res.status(404);
    throw new Error('Analysis not found');
  }
  res.json({ message: 'Analysis deleted' });
});
