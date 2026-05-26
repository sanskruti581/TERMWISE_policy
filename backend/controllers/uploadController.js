import asyncHandler from '../utils/asyncHandler.js';
import { extractTextFromFile } from '../services/extractionService.js';

export const uploadDocument = asyncHandler(async (req, res) => {
  const extractedText = await extractTextFromFile(req.file);
  res.json({ extractedText, characters: extractedText.length });
});
