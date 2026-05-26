import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { sanitizeText } from '../utils/sanitizeText.js';

const MIN_EXTRACTED_TEXT_LENGTH = 30;

const removeUploadedFile = async (filePath) => {
  if (filePath) {
    await fs.unlink(filePath).catch(() => {});
  }
};

const buildExtractionError = (message, statusCode = 422) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const extractPdfText = async (file) => {
  try {
    const buffer = await fs.readFile(file.path);
    const parsedPdf = await pdfParse(buffer);
    const extractedText = sanitizeText(parsedPdf.text);

    if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
      throw buildExtractionError(
        'This PDF appears to be scanned or image-only. Please upload a PNG/JPG screenshot of the page or paste the policy text.',
        422
      );
    }

    console.log(`PDF extraction success: ${file.originalname}, pages=${parsedPdf.numpages || 'unknown'}, chars=${extractedText.length}`);
    return extractedText;
  } catch (error) {
    if (error.statusCode) {
      console.warn(`PDF extraction warning: ${error.message}`);
      throw error;
    }

    console.error(`PDF extraction failed: ${file.originalname}`, error.message);
    throw buildExtractionError('Unable to read this PDF. It may be corrupted, encrypted, or unsupported.', 422);
  }
};

const extractImageText = async (file) => {
  let worker;

  try {
    worker = await createWorker('eng', 1, {
      logger: (event) => {
        if (event.status && typeof event.progress === 'number') {
          console.log(`OCR progress: ${file.originalname} - ${event.status} ${Math.round(event.progress * 100)}%`);
        }
      }
    });

    const result = await worker.recognize(file.path);
    const extractedText = sanitizeText(result.data.text);

    if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
      throw buildExtractionError('OCR completed, but no readable policy text was found in the image.', 422);
    }

    console.log(`OCR success: ${file.originalname}, confidence=${Math.round(result.data.confidence || 0)}%, chars=${extractedText.length}`);
    return extractedText;
  } catch (error) {
    if (error.statusCode) {
      console.warn(`OCR warning: ${error.message}`);
      throw error;
    }

    console.error(`OCR failure: ${file.originalname}`, error.message);
    throw buildExtractionError('OCR failed for this image. Please try a clearer image or paste the text manually.', 422);
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
};

export const extractTextFromFile = async (file) => {
  if (!file) {
    throw buildExtractionError('No file uploaded', 400);
  }

  console.log(`File upload received: ${file.originalname}, type=${file.mimetype}, size=${file.size} bytes`);

  try {
    if (file.mimetype === 'application/pdf') {
      return await extractPdfText(file);
    }

    if (file.mimetype.startsWith('image/')) {
      return await extractImageText(file);
    }

    throw buildExtractionError('Unsupported file type', 400);
  } finally {
    await removeUploadedFile(file.path);
  }
};
