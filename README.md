# TermsWise

TermsWise is a full-stack MERN application for analyzing Privacy Policies and Terms & Conditions. It extracts text from PDFs or images, scans for risky privacy language, generates a risk score and grade, optionally asks Groq for a plain-English summary, and saves analysis history in MongoDB.

## Tech Stack

- Frontend: React, Vite, TailwindCSS, Axios, React Router
- Backend: Node.js, Express, MongoDB, Mongoose
- File extraction: Multer, pdf-parse, Tesseract.js
- AI: Optional Groq API integration

## Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/termswise
GROQ_API_KEY=
PORT=5000
CLIENT_URL=http://localhost:5173
```

4. Start MongoDB locally. TermsWise expects:

```text
mongodb://127.0.0.1:27017/termswise
```

5. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## API Documentation

### `POST /api/upload`

Accepts a `multipart/form-data` upload with a `file` field.

Supported files: PDF, JPG, JPEG, PNG.

Response:

```json
{
  "extractedText": "Extracted document text...",
  "characters": 1234
}
```

### `POST /api/analyze`

Body:

```json
{
  "title": "Example Policy",
  "text": "Policy text...",
  "sourceType": "text"
}
```

Returns the saved analysis, including risk score, privacy grade, detected risks, highlighted clauses, recommendations, and summary.

### `GET /api/history`

Returns recent saved analyses. Optional query:

```text
/api/history?search=location
```

### `GET /api/history/:id`

Returns one saved analysis.

### `DELETE /api/history/:id`

Deletes one saved analysis.

## Notes

- Groq is optional. Without `GROQ_API_KEY`, TermsWise uses a local fallback summary.
- Uploaded files are validated by MIME type, limited to 10 MB, processed, and removed from disk.
- PDF text extraction uses `pdf-parse`. Image uploads use Tesseract OCR. Scanned/image-only PDFs are detected safely and return a clear 422 response; upload a PNG/JPG of the page or paste text for those documents.
- The backend logs MongoDB connection, server startup, file upload, OCR/PDF extraction, MongoDB save, and API errors.
- The risk engine is rule-based and should be treated as a review aid, not legal advice.

## Local Stability Checklist

```bash
npm.cmd run build --prefix frontend
npm.cmd audit --prefix backend
npm.cmd audit --prefix frontend
```

PowerShell may block `npm.ps1` on some Windows systems. Use `npm.cmd` if that happens.
